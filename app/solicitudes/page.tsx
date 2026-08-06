import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/src/components/app-shell";
import { StatusBadge } from "@/src/components/status-badge";
import {
  listRequests,
  requestStatuses,
  type RequestOrder,
  type RequestPeriod,
} from "@/src/features/requests/repository";
import { formatDateTime, requestStatusLabel } from "@/src/lib/format";
import type { RequestStatus } from "@/src/types/domain";

export const metadata: Metadata = { title: "Solicitudes" };

function parseStatus(value?: string): RequestStatus | undefined {
  return requestStatuses.includes(value as RequestStatus) ? value as RequestStatus : undefined;
}

function parsePeriod(value?: string): RequestPeriod {
  return ["1", "7", "30"].includes(value ?? "") ? value as RequestPeriod : "all";
}

function parseOrder(value?: string): RequestOrder {
  return value === "oldest" ? "oldest" : "recent";
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; periodo?: string; orden?: string }>;
}) {
  const query = await searchParams;
  const filters = {
    status: parseStatus(query.estado),
    period: parsePeriod(query.periodo),
    order: parseOrder(query.orden),
  };
  const result = await listRequests(filters);

  return (
    <AppShell active="solicitudes" eyebrow="Entrada desde el QR" title="Solicitudes">
      <form className="toolbar request-toolbar" method="get">
        <label>Estado<select defaultValue={filters.status ?? "all"} name="estado"><option value="all">Todas</option>{requestStatuses.map((status) => <option key={status} value={status}>{requestStatusLabel[status]}</option>)}</select></label>
        <label>Período<select defaultValue={filters.period} name="periodo"><option value="all">Todo el historial</option><option value="1">Últimas 24 horas</option><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option></select></label>
        <label>Orden<select defaultValue={filters.order} name="orden"><option value="recent">Más recientes</option><option value="oldest">Más antiguas</option></select></label>
        <button className="button button-secondary" type="submit">Aplicar filtros</button>
      </form>

      {result.errorReference ? (
        <div className="empty-state" role="alert"><strong>No fue posible cargar las solicitudes</strong><span>Reintenta en unos segundos. Código: {result.errorReference}</span><Link className="button button-secondary" href="/solicitudes">Reintentar</Link></div>
      ) : result.data.length === 0 ? (
        <div className="empty-state"><strong>No hay solicitudes con estos filtros</strong><span>Las solicitudes enviadas desde el QR aparecerán en esta lista.</span><Link href="/solicitudes">Limpiar filtros</Link></div>
      ) : (
        <div className="list-card">
          {result.data.map((request) => (
            <Link className="list-row" href={`/solicitudes/${request.folio}`} key={request.folio}>
              <span className="list-main"><strong>{request.folio} · {request.clientName}</strong><small>{request.piece} · {request.requestedWork}</small></span>
              <span className="list-side"><StatusBadge label={requestStatusLabel[request.status]} tone={request.status} /><small>{formatDateTime(request.submittedAt)}</small></span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
