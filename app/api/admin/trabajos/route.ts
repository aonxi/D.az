import { adminJson, readAdminJson } from "@/src/features/admin/http";
import { toWorkOrderRpcParams } from "@/src/features/work-orders/rpc-params";
import { validateWorkOrderDraft } from "@/src/features/work-orders/validation";
import { isDemoMode } from "@/src/lib/supabase/config";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

type WorkOrderResult = {
  resultado: "created" | "replayed";
  ot_folio: string;
  cliente_id: string;
};

export async function POST(request: Request) {
  const adminRequest = await readAdminJson(request);
  if ("response" in adminRequest) return adminRequest.response;

  const validation = validateWorkOrderDraft(adminRequest.data);
  if (!validation.ok) return adminJson({ message: "Revisa los campos indicados.", errors: validation.errors }, 422);

  if (isDemoMode()) {
    return adminJson({ result: "created", otFolio: "OT-2026-0011", demo: true }, 201);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("crear_ot_manual", toWorkOrderRpcParams(validation.data));

  if (error) {
    const reference = crypto.randomUUID();
    console.error("create_manual_work_order_failed", { reference, code: error.code });
    return adminJson({ message: "No fue posible guardar la OT.", reference }, 409);
  }

  const result = (Array.isArray(data) ? data[0] : data) as WorkOrderResult | null;
  if (!result?.ot_folio) {
    return adminJson({ message: "No fue posible confirmar la nueva OT.", reference: crypto.randomUUID() }, 500);
  }

  return adminJson({
    result: result.resultado,
    otFolio: result.ot_folio,
    clientId: result.cliente_id,
    demo: false,
  }, result.resultado === "created" ? 201 : 200);
}
