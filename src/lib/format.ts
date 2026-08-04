import type { Priority, QuoteStatus, RequestStatus, WorkOrder, WorkStatus } from "@/src/types/domain";

export const priorityLabel: Record<Priority, string> = { baja: "Baja", normal: "Normal", alta: "Alta", urgente: "Urgente" };
export const requestStatusLabel: Record<RequestStatus, string> = { nueva: "Nueva", revision: "En revisión", requiere_info: "Requiere información", aceptada: "Aceptada", cotizada: "Cotizada primero", rechazada: "Rechazada" };
export const workStatusLabel: Record<WorkStatus, string> = { pendiente: "Pendiente", en_proceso: "En proceso", esperando_material: "Esperando material", listo: "Listo para entregar", entregado: "Entregado", cancelado: "Cancelado" };
export const quoteStatusLabel: Record<QuoteStatus, string> = { borrador: "Borrador", emitida: "Emitida", aprobada: "Aprobada", rechazada: "Rechazada", vencida: "Vencida", reemplazada: "Reemplazada" };

export function formatClp(value: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Santiago" }).format(new Date(`${value}T12:00:00-04:00`));
}

const priorityWeight: Record<Priority, number> = { urgente: 4, alta: 3, normal: 2, baja: 1 };

export function sortRecommended(items: WorkOrder[]) {
  return [...items].sort((a, b) => {
    const priority = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priority !== 0) return priority;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate) || a.receivedDate.localeCompare(b.receivedDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.receivedDate.localeCompare(b.receivedDate);
  });
}
