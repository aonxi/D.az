import { createSupabaseServiceClient, hasSupabaseServiceConfig } from "@/src/lib/supabase/service";
import {
  isValidIdempotencyKey,
  PUBLIC_REQUEST_MAX_BODY_BYTES,
  validatePublicRequest,
} from "@/src/features/requests/validation";

type RpcResult = {
  resultado: "created" | "replayed" | "rate_limited" | "idempotency_conflict";
  folio: string | null;
};

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
};

function json(body: unknown, status: number, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...noStoreHeaders, ...extraHeaders },
  });
}

function getPositiveInteger(name: string, fallback: number, maximum: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= maximum ? parsed : fallback;
}

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  let configuredOrigin = requestOrigin;
  try {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      configuredOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL).origin;
    }
  } catch {
    configuredOrigin = requestOrigin;
  }

  if (!origin) return process.env.NODE_ENV !== "production";
  return origin === requestOrigin || origin === configuredOrigin;
}

function getClientAddress(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return json({ message: "No fue posible procesar la solicitud." }, 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json({ message: "El formulario no tiene un formato válido." }, 415);
  }

  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (contentLength > PUBLIC_REQUEST_MAX_BODY_BYTES) {
    return json({ message: "El formulario supera el tamaño permitido." }, 413);
  }

  const idempotencyKey = request.headers.get("idempotency-key");
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return json({ message: "Recarga el formulario e inténtalo nuevamente." }, 400);
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return json({ message: "No fue posible leer el formulario." }, 400);
  }

  if (new TextEncoder().encode(rawBody).byteLength > PUBLIC_REQUEST_MAX_BODY_BYTES) {
    return json({ message: "El formulario supera el tamaño permitido." }, 413);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return json({ message: "El formulario no tiene un formato válido." }, 400);
  }

  const validation = validatePublicRequest(parsed);
  if (!validation.ok) {
    return json(
      {
        message: validation.honeypotFilled
          ? "No fue posible enviar el formulario."
          : "Revisa los campos indicados.",
        errors: validation.honeypotFilled ? undefined : validation.errors,
      },
      422,
    );
  }

  const rateLimitSecret = process.env.PUBLIC_FORM_RATE_LIMIT_SECRET;
  if (
    process.env.NEXT_PUBLIC_APP_MODE !== "supabase" ||
    !hasSupabaseServiceConfig() ||
    !rateLimitSecret ||
    rateLimitSecret.length < 32
  ) {
    return json(
      {
        message: "El formulario está temporalmente fuera de servicio. Inténtalo más tarde.",
        reference: crypto.randomUUID(),
      },
      503,
    );
  }

  const { completedTooQuickly, ...requestData } = validation.data;
  const payloadHash = await sha256(JSON.stringify(requestData));
  const ipHash = await hmacSha256(rateLimitSecret, getClientAddress(request));
  const ipLimit = getPositiveInteger("PUBLIC_FORM_IP_LIMIT", 12, 100);
  const globalLimit = getPositiveInteger("PUBLIC_FORM_GLOBAL_LIMIT", 300, 10_000);
  const windowMinutes = getPositiveInteger("PUBLIC_FORM_RATE_WINDOW_MINUTES", 60, 1_440);

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("crear_solicitud_publica", {
    p_idempotency_key: idempotencyKey,
    p_payload_hash: payloadHash,
    p_ip_hash: ipHash,
    p_nombre: requestData.nombre,
    p_telefono: requestData.telefono,
    p_empresa: requestData.empresa,
    p_rut: requestData.rut,
    p_correo: requestData.correo,
    p_pieza: requestData.pieza,
    p_trabajo: requestData.trabajo,
    p_fecha_solicitada: requestData.fechaSolicitada,
    p_observaciones: requestData.observaciones,
    p_submission_flags: completedTooQuickly ? ["completion_under_1500ms"] : [],
    p_ip_limit: ipLimit,
    p_global_limit: globalLimit,
    p_window_minutes: windowMinutes,
  });

  if (error) {
    const reference = crypto.randomUUID();
    console.error("public_request_rpc_failed", { reference, code: error.code });
    return json(
      { message: "No pudimos guardar la solicitud. Inténtalo nuevamente.", reference },
      500,
    );
  }

  const result = (Array.isArray(data) ? data[0] : data) as RpcResult | null;

  if (result?.resultado === "rate_limited") {
    return json(
      { message: "Se recibieron demasiadas solicitudes desde esta conexión. Inténtalo más tarde." },
      429,
      { "Retry-After": String(windowMinutes * 60) },
    );
  }

  if (result?.resultado === "idempotency_conflict") {
    return json({ message: "El formulario cambió durante el envío. Recárgalo e inténtalo nuevamente." }, 409);
  }

  if (!result?.folio || !["created", "replayed"].includes(result.resultado)) {
    return json(
      { message: "No pudimos confirmar la solicitud. Inténtalo nuevamente.", reference: crypto.randomUUID() },
      500,
    );
  }

  return json({ folio: result.folio }, result.resultado === "created" ? 201 : 200);
}
