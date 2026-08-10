import { workOrders as demoWorkOrders } from "@/src/data/mock-data";
import { isDemoMode } from "@/src/lib/supabase/config";
import { createSupabaseServerClient, requireAdminSession } from "@/src/lib/supabase/server";
import type { Priority, WorkOrder, WorkStatus } from "@/src/types/domain";

type WorkOrderRow = {
  folio: string;
  pieza: string;
  trabajo_realizar: string;
  cantidad: number;
  fecha_recepcion: string;
  fecha_comprometida: string | null;
  prioridad: Priority;
  estado: WorkStatus;
  origen: "qr" | "manual" | "cotizacion";
  observaciones_internas: string | null;
  manual_queue_position: number | null;
  cliente: { id: string; nombre_razon_social: string; telefono: string } | null;
  solicitud: { folio: string } | null;
  cotizacion_origen: { folio: string | null } | null;
};

export type WorkOrderRepositoryResult<T> = {
  data: T;
  isDemo: boolean;
  errorReference?: string;
};

const demoAcceptedOrder: WorkOrder = {
  folio: "OT-2026-0010",
  clientId: "10000000-0000-4000-8000-000000000001",
  clientName: "Patricia Soto",
  phone: "+56 9 1234 5678",
  piece: "Eje de portón",
  work: "Revisar desgaste y rectificar si es posible.",
  quantity: 1,
  receivedDate: "2026-08-10",
  dueDate: null,
  priority: "normal",
  status: "pendiente",
  origin: "SOL-2026-0014",
  requestFolio: "SOL-2026-0014",
  notes: "OT simulada: el modo demostración no guarda cambios.",
};

const demoManualOrder: WorkOrder = {
  folio: "OT-2026-0011",
  clientId: "10000000-0000-4000-8000-000000000002",
  clientName: "Carolina Pérez",
  phone: "+56 9 8765 4321",
  piece: "Pieza registrada manualmente",
  work: "Trabajo ingresado desde el formulario de demostración.",
  quantity: 1,
  receivedDate: "2026-08-10",
  dueDate: null,
  priority: "normal",
  status: "pendiente",
  origin: "Registro manual",
  notes: "OT simulada: el modo demostración no guarda cambios.",
};

function mapWorkOrder(row: WorkOrderRow): WorkOrder {
  const requestFolio = row.solicitud?.folio ?? undefined;
  const quoteOriginFolio = row.cotizacion_origen?.folio ?? undefined;
  const origin = row.origen === "qr"
    ? requestFolio ?? "Solicitud QR"
    : row.origen === "cotizacion"
      ? quoteOriginFolio ?? "Cotización"
      : "Registro manual";

  return {
    folio: row.folio,
    clientId: row.cliente?.id ?? "",
    clientName: row.cliente?.nombre_razon_social ?? "Cliente no disponible",
    phone: row.cliente?.telefono ?? "",
    piece: row.pieza,
    work: row.trabajo_realizar,
    quantity: row.cantidad,
    receivedDate: row.fecha_recepcion,
    dueDate: row.fecha_comprometida,
    priority: row.prioridad,
    status: row.estado,
    origin,
    requestFolio,
    quoteOriginFolio,
    notes: row.observaciones_internas ?? undefined,
    manualPosition: row.manual_queue_position ?? undefined,
  };
}

const workOrderSelection = "folio,pieza,trabajo_realizar,cantidad,fecha_recepcion,fecha_comprometida,prioridad,estado,origen,observaciones_internas,manual_queue_position,cliente:clientes!ordenes_trabajo_cliente_id_fkey(id,nombre_razon_social,telefono),solicitud:solicitudes!ordenes_trabajo_solicitud_id_fkey(folio),cotizacion_origen:cotizaciones!ot_cotizacion_origen_fk(folio)";

export async function listWorkOrders(): Promise<WorkOrderRepositoryResult<WorkOrder[]>> {
  await requireAdminSession();
  if (isDemoMode()) return { data: demoWorkOrders, isDemo: true };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ordenes_trabajo")
    .select(workOrderSelection)
    .order("created_at", { ascending: true })
    .limit(250);

  if (error) {
    const errorReference = crypto.randomUUID();
    console.error("admin_work_order_list_failed", { errorReference, code: error.code });
    return { data: [], isDemo: false, errorReference };
  }

  return { data: (data as unknown as WorkOrderRow[]).map(mapWorkOrder), isDemo: false };
}

export async function getWorkOrderByFolio(folio: string): Promise<WorkOrderRepositoryResult<WorkOrder | null>> {
  await requireAdminSession();
  if (isDemoMode()) {
    return {
      data: [...demoWorkOrders, demoAcceptedOrder, demoManualOrder].find((work) => work.folio === folio) ?? null,
      isDemo: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ordenes_trabajo")
    .select(workOrderSelection)
    .eq("folio", folio)
    .maybeSingle();

  if (error) {
    const errorReference = crypto.randomUUID();
    console.error("admin_work_order_detail_failed", { errorReference, code: error.code });
    return { data: null, isDemo: false, errorReference };
  }

  return { data: data ? mapWorkOrder(data as unknown as WorkOrderRow) : null, isDemo: false };
}
