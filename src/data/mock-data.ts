import type { Client, Quote, WorkOrder, WorkRequest } from "@/src/types/domain";
import { sortRecommended } from "@/src/lib/format";

export const clients: Client[] = [
  { id: "cli-patricia", type: "persona", name: "Patricia Soto", rut: "12.345.678-5", phone: "+56 9 1234 5678", email: "patricia@ejemplo.cl", address: "Los Aromos 124, Santiago" },
  { id: "cli-carolina", type: "persona", name: "Carolina Pérez", rut: "15.111.222-3", phone: "+56 9 8765 4321", email: "carolina@ejemplo.cl" },
  { id: "cli-andes", type: "empresa", name: "Maestranza Los Andes SpA", rut: "76.555.444-2", contact: "Luis Rojas", phone: "+56 9 2222 3333", email: "compras@losandes.ejemplo" },
  { id: "cli-metal", type: "empresa", name: "Metalúrgica Demo Ltda.", rut: "77.000.111-9", contact: "Ana Silva", phone: "+56 9 4444 5555" },
];

export const requests: WorkRequest[] = [
  { folio: "SOL-2026-0014", status: "nueva", clientName: "Patricia Soto", phone: "+56 9 1234 5678", piece: "Eje de portón", requestedWork: "Revisar desgaste y rectificar si es posible.", requestedDate: null, submittedAt: "2026-08-04T10:20:00-04:00", possibleClientId: "cli-patricia" },
  { folio: "SOL-2026-0013", status: "revision", clientName: "Constructora Ejemplo", phone: "+56 9 6060 7070", piece: "Cuatro bujes", requestedWork: "Fabricar según muestra entregada.", requestedDate: "2026-08-08", submittedAt: "2026-08-04T09:05:00-04:00", notes: "La persona de contacto pide confirmación por teléfono." },
  { folio: "SOL-2026-0012", status: "cotizada", clientName: "Carolina Pérez", phone: "+56 9 8765 4321", piece: "Soporte de motor", requestedWork: "Reforzar unión y soldar fisura lateral.", requestedDate: "2026-08-06", submittedAt: "2026-08-03T17:40:00-04:00", possibleClientId: "cli-carolina" },
];

export const workOrders: WorkOrder[] = [
  { folio: "OT-2026-0007", clientId: "cli-andes", clientName: "Maestranza Los Andes SpA", phone: "+56 9 2222 3333", piece: "Eje principal", work: "Rectificar eje", quantity: 1, receivedDate: "2026-08-01", dueDate: "2026-08-04", priority: "urgente", status: "en_proceso", origin: "Registro manual", notes: "Confirmar diámetro final antes de retirar." },
  { folio: "OT-2026-0005", clientId: "cli-metal", clientName: "Metalúrgica Demo Ltda.", phone: "+56 9 4444 5555", piece: "Matriz de corte", work: "Reparar matriz", quantity: 1, receivedDate: "2026-07-30", dueDate: null, priority: "alta", status: "esperando_material", origin: "WhatsApp" },
  { folio: "OT-2026-0008", clientId: "cli-carolina", clientName: "Carolina Pérez", phone: "+56 9 8765 4321", piece: "Soporte de motor", work: "Soldar soporte", quantity: 2, receivedDate: "2026-08-04", dueDate: null, priority: "normal", status: "pendiente", origin: "SOL-2026-0012", notes: "Confirmar posición antes de soldar." },
  { folio: "OT-2026-0004", clientId: "cli-patricia", clientName: "Patricia Soto", phone: "+56 9 1234 5678", piece: "Pasador de acero", work: "Fabricar pasador", quantity: 3, receivedDate: "2026-07-29", dueDate: "2026-08-03", priority: "normal", status: "pendiente", origin: "Presencial" },
  { folio: "OT-2026-0009", clientId: "cli-andes", clientName: "Maestranza Los Andes SpA", phone: "+56 9 2222 3333", piece: "Dos poleas", work: "Rectificar alojamientos", quantity: 2, receivedDate: "2026-08-02", dueDate: "2026-08-05", priority: "normal", status: "listo", origin: "Registro manual" },
];

export const quotes: Quote[] = [
  { folio: "COT-2026-0001", version: 1, clientName: "Carolina Pérez", reference: "OT-2026-0008", issuedDate: "2026-08-04", expiresDate: "2026-09-03", status: "emitida", net: 150000, vat: 28500, total: 178500, deposit: 0 },
  { folio: "COT-2026-0002", version: 1, clientName: "Maestranza Los Andes SpA", reference: "OT-2026-0007", issuedDate: "2026-08-02", expiresDate: "2026-09-01", status: "emitida", net: 240000, vat: 45600, total: 285600, deposit: 0 },
  { folio: "COT-2026-0003", version: 2, clientName: "Metalúrgica Demo Ltda.", reference: "OT-2026-0005", issuedDate: "2026-08-01", expiresDate: "2026-08-31", status: "aprobada", net: 380000, vat: 72200, total: 452200, deposit: 100000 },
];

export const recommendedWork = sortRecommended(workOrders.filter((work) => !["entregado", "cancelado", "listo"].includes(work.status)))[0];

export const dashboardCounts = {
  newRequests: requests.filter((request) => request.status === "nueva").length,
  today: workOrders.filter((work) => work.dueDate === "2026-08-04" && !["entregado", "cancelado"].includes(work.status)).length,
  overdue: workOrders.filter((work) => work.dueDate && work.dueDate < "2026-08-04" && !["entregado", "cancelado"].includes(work.status)).length,
  ready: workOrders.filter((work) => work.status === "listo").length,
};
