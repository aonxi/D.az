import { requests as demoRequests } from "@/src/data/mock-data";
import { isDemoMode } from "@/src/lib/supabase/config";
import { createSupabaseServerClient, requireAdminSession } from "@/src/lib/supabase/server";
import type { RequestStatus, WorkRequest } from "@/src/types/domain";

export const requestStatuses: RequestStatus[] = [
  "nueva",
  "revision",
  "requiere_info",
  "aceptada",
  "cotizada",
  "rechazada",
];

export type RequestPeriod = "all" | "1" | "7" | "30";
export type RequestOrder = "recent" | "oldest";

export type RequestFilters = {
  status?: RequestStatus;
  period: RequestPeriod;
  order: RequestOrder;
};

type RequestRow = {
  folio: string;
  estado: RequestStatus;
  nombre_ingresado: string;
  telefono_ingresado: string;
  empresa_ingresada: string | null;
  rut_ingresado: string | null;
  correo_ingresado: string | null;
  pieza_ingresada: string;
  trabajo_ingresado: string;
  fecha_solicitada: string | null;
  observaciones_ingresadas: string | null;
  decision_note: string | null;
  cliente_id: string | null;
  submitted_at: string;
};

type RepositoryResult<T> = {
  data: T;
  isDemo: boolean;
  errorReference?: string;
};

function mapRequest(row: RequestRow): WorkRequest {
  return {
    folio: row.folio,
    status: row.estado,
    clientName: row.nombre_ingresado,
    phone: row.telefono_ingresado,
    company: row.empresa_ingresada ?? undefined,
    rut: row.rut_ingresado ?? undefined,
    email: row.correo_ingresado ?? undefined,
    piece: row.pieza_ingresada,
    requestedWork: row.trabajo_ingresado,
    requestedDate: row.fecha_solicitada,
    notes: row.observaciones_ingresadas ?? undefined,
    decisionNote: row.decision_note ?? undefined,
    possibleClientId: row.cliente_id ?? undefined,
    submittedAt: row.submitted_at,
  };
}

function filterDemoRequests(filters: RequestFilters) {
  const minimumTimestamp =
    filters.period === "all"
      ? null
      : Date.now() - Number(filters.period) * 24 * 60 * 60 * 1_000;

  return demoRequests
    .filter((request) => !filters.status || request.status === filters.status)
    .filter((request) => !minimumTimestamp || new Date(request.submittedAt).getTime() >= minimumTimestamp)
    .sort((a, b) => {
      const comparison = a.submittedAt.localeCompare(b.submittedAt);
      return filters.order === "oldest" ? comparison : -comparison;
    });
}

export async function listRequests(filters: RequestFilters): Promise<RepositoryResult<WorkRequest[]>> {
  await requireAdminSession();

  if (isDemoMode()) {
    return { data: filterDemoRequests(filters), isDemo: true };
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("solicitudes")
    .select("folio,estado,nombre_ingresado,telefono_ingresado,empresa_ingresada,rut_ingresado,correo_ingresado,pieza_ingresada,trabajo_ingresado,fecha_solicitada,observaciones_ingresadas,decision_note,cliente_id,submitted_at")
    .order("submitted_at", { ascending: filters.order === "oldest" })
    .limit(100);

  if (filters.status) query = query.eq("estado", filters.status);
  if (filters.period !== "all") {
    const minimum = new Date(Date.now() - Number(filters.period) * 24 * 60 * 60 * 1_000);
    query = query.gte("submitted_at", minimum.toISOString());
  }

  const { data, error } = await query;
  if (error) {
    const errorReference = crypto.randomUUID();
    console.error("admin_request_list_failed", { errorReference, code: error.code });
    return { data: [], isDemo: false, errorReference };
  }

  return { data: (data as RequestRow[]).map(mapRequest), isDemo: false };
}

export async function getRequestByFolio(folio: string): Promise<RepositoryResult<WorkRequest | null>> {
  await requireAdminSession();

  if (isDemoMode()) {
    return {
      data: demoRequests.find((request) => request.folio === folio) ?? null,
      isDemo: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("solicitudes")
    .select("folio,estado,nombre_ingresado,telefono_ingresado,empresa_ingresada,rut_ingresado,correo_ingresado,pieza_ingresada,trabajo_ingresado,fecha_solicitada,observaciones_ingresadas,decision_note,cliente_id,submitted_at")
    .eq("folio", folio)
    .maybeSingle();

  if (error) {
    const errorReference = crypto.randomUUID();
    console.error("admin_request_detail_failed", { errorReference, code: error.code });
    return { data: null, isDemo: false, errorReference };
  }

  return { data: data ? mapRequest(data as RequestRow) : null, isDemo: false };
}
