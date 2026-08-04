export type RequestStatus = "nueva" | "revision" | "requiere_info" | "aceptada" | "cotizada" | "rechazada";
export type WorkStatus = "pendiente" | "en_proceso" | "esperando_material" | "listo" | "entregado" | "cancelado";
export type Priority = "baja" | "normal" | "alta" | "urgente";
export type QuoteStatus = "borrador" | "emitida" | "aprobada" | "rechazada" | "vencida" | "reemplazada";

export interface Client {
  id: string;
  type: "persona" | "empresa";
  name: string;
  rut?: string;
  contact?: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface WorkRequest {
  folio: string;
  status: RequestStatus;
  clientName: string;
  phone: string;
  piece: string;
  requestedWork: string;
  requestedDate: string | null;
  submittedAt: string;
  notes?: string;
  possibleClientId?: string;
}

export interface WorkOrder {
  folio: string;
  clientId: string;
  clientName: string;
  phone: string;
  piece: string;
  work: string;
  quantity: number;
  receivedDate: string;
  dueDate: string | null;
  priority: Priority;
  status: WorkStatus;
  origin: string;
  notes?: string;
  manualPosition?: number;
}

export interface Quote {
  folio: string;
  version: number;
  clientName: string;
  reference?: string;
  issuedDate?: string;
  expiresDate?: string;
  status: QuoteStatus;
  net: number;
  vat: number;
  total: number;
  deposit: number;
}
