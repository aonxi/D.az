import type { Priority, WorkStatus } from "@/src/types/domain";

const priorities: Priority[] = ["baja", "normal", "alta", "urgente"];
const initialStatuses: WorkStatus[] = ["pendiente", "en_proceso", "esperando_material"];
const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export type ClientDraft = {
  mode: "existing" | "new";
  existingId: string | null;
  type: "persona" | "empresa";
  name: string;
  rut: string | null;
  contact: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
};

export type WorkOrderDraft = {
  idempotencyKey: string;
  client: ClientDraft;
  piece: string;
  work: string;
  quantity: number;
  receivedDate: string;
  dueDate: string | null;
  priority: Priority;
  status: Extract<WorkStatus, "pendiente" | "en_proceso" | "esperando_material">;
  notes: string | null;
};

export type WorkOrderValidation =
  | { ok: true; data: WorkOrderDraft }
  | { ok: false; errors: Record<string, string> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, maximum: number) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maximum + 1);
}

function optionalText(value: unknown, maximum: number) {
  return text(value, maximum) || null;
}

function isCalendarDate(value: string) {
  if (!datePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isUuidV4(value: unknown): value is string {
  return typeof value === "string" && uuidV4Pattern.test(value);
}

export function validateWorkOrderDraft(value: unknown): WorkOrderValidation {
  if (!isRecord(value) || !isRecord(value.client)) {
    return { ok: false, errors: { general: "Los datos enviados no tienen un formato válido." } };
  }

  const errors: Record<string, string> = {};
  const clientMode = value.client.mode === "existing" ? "existing" : "new";
  const clientId = isUuidV4(value.client.existingId) ? value.client.existingId : null;
  const clientType = value.client.type === "empresa" ? "empresa" : "persona";
  const clientName = text(value.client.name, 180);
  const clientRut = optionalText(value.client.rut, 20);
  const clientContact = optionalText(value.client.contact, 160);
  const clientPhone = text(value.client.phone, 30);
  const clientEmail = optionalText(value.client.email, 254)?.toLowerCase() ?? null;
  const clientAddress = optionalText(value.client.address, 500);
  const clientNotes = optionalText(value.client.notes, 2000);
  const piece = text(value.piece, 300);
  const work = text(value.work, 2000);
  const quantity = typeof value.quantity === "number" ? value.quantity : Number(value.quantity);
  const receivedDate = text(value.receivedDate, 10);
  const dueDate = optionalText(value.dueDate, 10);
  const priority = priorities.includes(value.priority as Priority) ? value.priority as Priority : "normal";
  const status = initialStatuses.includes(value.status as WorkStatus)
    ? value.status as WorkOrderDraft["status"]
    : "pendiente";
  const notes = optionalText(value.notes, 2000);

  if (!isUuidV4(value.idempotencyKey)) errors.idempotencyKey = "Recarga el formulario e inténtalo nuevamente.";
  if (clientMode === "existing" && !clientId) errors.client = "Selecciona un cliente existente.";
  if (clientMode === "new") {
    if (clientName.length < 2 || clientName.length > 180) errors.clientName = "Ingresa el nombre o razón social.";
    if (clientPhone.length < 6 || clientPhone.length > 30) errors.clientPhone = "Ingresa un teléfono válido.";
    if (clientEmail && !emailPattern.test(clientEmail)) errors.clientEmail = "Revisa el correo electrónico.";
  }
  if (piece.length < 2 || piece.length > 300) errors.piece = "Describe la pieza.";
  if (work.length < 2 || work.length > 2000) errors.work = "Describe el trabajo a realizar.";
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) errors.quantity = "Usa una cantidad entera mayor que cero.";
  if (!isCalendarDate(receivedDate)) errors.receivedDate = "Selecciona una fecha de recepción válida.";
  if (dueDate && !isCalendarDate(dueDate)) errors.dueDate = "Selecciona una fecha comprometida válida.";
  if (dueDate && receivedDate && dueDate < receivedDate) errors.dueDate = "La entrega no puede ser anterior a la recepción.";
  if (notes && notes.length > 2000) errors.notes = "Las observaciones son demasiado largas.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      idempotencyKey: value.idempotencyKey as string,
      client: {
        mode: clientMode,
        existingId: clientId,
        type: clientType,
        name: clientName,
        rut: clientRut,
        contact: clientContact,
        phone: clientPhone,
        email: clientEmail,
        address: clientAddress,
        notes: clientNotes,
      },
      piece,
      work,
      quantity,
      receivedDate,
      dueDate,
      priority,
      status,
      notes,
    },
  };
}
