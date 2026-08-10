import type { WorkOrderDraft } from "@/src/features/work-orders/validation";

export function toWorkOrderRpcParams(draft: WorkOrderDraft) {
  const isExisting = draft.client.mode === "existing";
  return {
    p_idempotency_key: draft.idempotencyKey,
    p_cliente_id: isExisting ? draft.client.existingId : null,
    p_cliente_tipo: draft.client.type,
    p_cliente_nombre: isExisting ? "Cliente existente" : draft.client.name,
    p_cliente_rut: isExisting ? null : draft.client.rut,
    p_cliente_contacto: isExisting ? null : draft.client.contact,
    p_cliente_telefono: isExisting ? "No aplica" : draft.client.phone,
    p_cliente_correo: isExisting ? null : draft.client.email,
    p_cliente_direccion: isExisting ? null : draft.client.address,
    p_cliente_notas: isExisting ? null : draft.client.notes,
    p_pieza: draft.piece,
    p_trabajo: draft.work,
    p_cantidad: draft.quantity,
    p_fecha_recepcion: draft.receivedDate,
    p_fecha_comprometida: draft.dueDate,
    p_prioridad: draft.priority,
    p_estado: draft.status,
    p_observaciones: draft.notes,
  };
}
