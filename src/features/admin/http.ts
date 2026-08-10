import { getAdminSession } from "@/src/lib/supabase/server";

export const ADMIN_MAX_BODY_BYTES = 24_576;

const jsonHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
};

export function adminJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

export function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  return origin === new URL(request.url).origin;
}

export async function readAdminJson(request: Request) {
  const session = await getAdminSession();
  if (!session) return { response: adminJson({ message: "Debes iniciar sesión nuevamente." }, 401) } as const;
  if (!hasSameOrigin(request)) return { response: adminJson({ message: "La solicitud no tiene un origen válido." }, 403) } as const;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return { response: adminJson({ message: "Los datos no tienen un formato válido." }, 415) } as const;
  }

  const length = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (length > ADMIN_MAX_BODY_BYTES) return { response: adminJson({ message: "Los datos superan el tamaño permitido." }, 413) } as const;

  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > ADMIN_MAX_BODY_BYTES) {
      return { response: adminJson({ message: "Los datos superan el tamaño permitido." }, 413) } as const;
    }
    return { session, data: JSON.parse(raw) as unknown } as const;
  } catch {
    return { response: adminJson({ message: "No fue posible leer los datos." }, 400) } as const;
  }
}
