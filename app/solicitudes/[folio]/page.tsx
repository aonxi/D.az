import { notFound } from "next/navigation";
import { AppShell } from "@/src/components/app-shell";
import { StatusBadge } from "@/src/components/status-badge";
import { getRequestByFolio } from "@/src/features/requests/repository";
import { formatDate, formatDateTime, requestStatusLabel } from "@/src/lib/format";

export default async function RequestDetailPage({ params }: { params: Promise<{ folio: string }> }) {
  const { folio } = await params;
  const result = await getRequestByFolio(folio);
  if (result.errorReference) {
    return <AppShell active="solicitudes" eyebrow={folio} title="Revisar solicitud"><div className="empty-state" role="alert"><strong>No fue posible cargar la solicitud</strong><span>Reintenta en unos segundos. Código: {result.errorReference}</span></div></AppShell>;
  }
  if (!result.data) notFound();
  const request = result.data;

  return (
    <AppShell active="solicitudes" eyebrow={request.folio} title="Revisar solicitud" action={<StatusBadge label={requestStatusLabel[request.status]} tone={request.status} />}>
      <section className="detail-layout">
        <div className="panel-card">
          <div className="section-heading"><div><span className="eyebrow">Información original</span><h2>Datos enviados por el cliente</h2></div><button className="button button-secondary" disabled type="button">Corregir en Etapa 4</button></div>
          <dl className="detail-list">
            <div><dt>Nombre</dt><dd>{request.clientName}</dd></div>
            <div><dt>Teléfono</dt><dd><a href={`tel:${request.phone}`}>{request.phone}</a></dd></div>
            <div><dt>Empresa</dt><dd>{request.company ?? "No indicada"}</dd></div>
            <div><dt>RUT</dt><dd>{request.rut ?? "No indicado"}</dd></div>
            <div><dt>Correo</dt><dd>{request.email ? <a href={`mailto:${request.email}`}>{request.email}</a> : "No indicado"}</dd></div>
            <div><dt>Pieza</dt><dd>{request.piece}</dd></div>
            <div><dt>Trabajo solicitado</dt><dd>{request.requestedWork}</dd></div>
            <div><dt>Fecha solicitada</dt><dd>{request.requestedDate ? formatDate(request.requestedDate) : "Sin fecha indicada"}</dd></div>
            <div><dt>Observaciones</dt><dd>{request.notes ?? "Sin observaciones"}</dd></div>
            <div><dt>Enviada</dt><dd>{formatDateTime(request.submittedAt)}</dd></div>
          </dl>
        </div>

        <aside className="decision-column">
          <div className="notice-box"><strong>Solicitud pendiente de decisión</strong><span>Esta etapa permite revisar los datos originales. La conversión a cliente, OT o cotización comienza en la Etapa 4.</span></div>
          <div className="panel-card compact-card">
            <h2>Decisiones administrativas</h2>
            <button className="button button-primary button-block" disabled type="button">Aceptar y crear OT</button>
            <button className="button button-secondary button-block" disabled type="button">Cotizar primero</button>
            <div className="split-actions"><button className="text-button" disabled type="button">Pedir información</button><button className="text-button danger" disabled type="button">Rechazar</button></div>
            <small>Estas acciones se habilitarán en la Etapa 4 para que sean transaccionales e idempotentes.</small>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
