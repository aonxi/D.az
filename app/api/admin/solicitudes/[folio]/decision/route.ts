import { adminJson, readAdminJson } from "@/src/features/admin/http";
import { isDemoMode } from "@/src/lib/supabase/config";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

const allowedStatuses = ["revision", "requiere_info", "rechazada"] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ folio: string }> },
) {
  const adminRequest = await readAdminJson(request);
  if ("response" in adminRequest) return adminRequest.response;
  if (!adminRequest.data || typeof adminRequest.data !== "object" || Array.isArray(adminRequest.data)) {
    return adminJson({ message: "Los datos no tienen un formato válido." }, 400);
  }

  const { folio } = await params;
  const data = adminRequest.data as Record<string, unknown>;
  const status = typeof data.status === "string" && allowedStatuses.includes(data.status as typeof allowedStatuses[number])
    ? data.status as typeof allowedStatuses[number]
    : null;
  const note = typeof data.note === "string" ? data.note.trim() : "";

  if (!/^SOL-\d{4}-\d{4,}$/.test(folio) || !status || note.length > 2000) {
    return adminJson({ message: "La decisión indicada no es válida." }, 422);
  }

  if (isDemoMode()) return adminJson({ result: "updated", status, demo: true });

  const supabase = await createSupabaseServerClient();
  const { data: result, error } = await supabase.rpc("registrar_decision_solicitud", {
    p_solicitud_folio: folio,
    p_estado: status,
    p_nota: note || null,
  });

  if (error) {
    const reference = crypto.randomUUID();
    console.error("update_request_decision_failed", { reference, code: error.code });
    return adminJson({ message: "No fue posible actualizar la solicitud.", reference }, 409);
  }

  const row = Array.isArray(result) ? result[0] : result;
  return adminJson({ result: row?.resultado ?? "updated", status: row?.estado ?? status, demo: false });
}
