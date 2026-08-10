import { notFound } from "next/navigation";
import { AppShell } from "@/src/components/app-shell";
import { StatusBadge } from "@/src/components/status-badge";
import { listClients, suggestClientId } from "@/src/features/clients/repository";
import { RequestDecisionActions } from "@/src/features/requests/request-decision-actions";
import { getRequestByFolio } from "@/src/features/requests/repository";
import { WorkOrderForm } from "@/src/features/work-orders/work-order-form";
import { todayInChile } from "@/src/lib/date";
import { formatDate, formatDateTime, requestStatusLabel } from "@/src/lib/format";

export default async function RequestDetailPage({ params }: { params: Promise<{ folio: string }> }) {
  const { folio } = await params;
  const [requestResult, clientsResult] = await Promise.all([getRequestByFolio(folio), listClients()]);

  if (requestResult.errorReference) {
    return <AppShell active="solicitudes" eyebrow={folio} title="Revisar solicitud"><div className="empty-state" role="alert"><strong>No fue posible cargar la solicitud</strong><span>Reintenta en unos segundos. Código: {requestResult.errorReference}</span></div></AppShell>;
  }
  if (!requestResult.data) notFound();
  const request = requestResult.data;
  const suggestedClientId = suggestClientId(request, clientsResult.data);
  const canConvert = !["aceptada", "rechazada"].includes(request.status);

  return (
    <AppShell active="solicitudes" eyebrow={request.folio} title="Revisar solicitud" action={<StatusBadge label={requestStatusLabel[request.status]} tone={request.status} />}>
      <section className="detail-layout">
        <div className="detail-main">
          <div className="panel-card">
            <div className="section-heading"><div><span className="eyebrow">Información original</span><h2>Datos enviados por el cliente</h2></div><span className="status-badge" data-tone="revision">No se sobrescriben</span></div>
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
              <div><dt>Nota administrativa</dt><dd>{request.decisionNote ?? "Sin nota"}</dd></div>
              <div><dt>Enviada</dt><dd>{formatDateTime(request.submittedAt)}</dd></div>
            </dl>
          </div>

          {canConvert && (
            <div id="aceptar-ot">
              <div className="section-heading"><div><span className="eyebrow">Datos operativos corregibles</span><h2>Aceptar y crear orden de trabajo</h2></div></div>
              {clientsResult.errorReference && <p className="form-message error" role="alert">No pudimos cargar los clientes existentes. Puedes crear uno nuevo. Código: {clientsResult.errorReference}</p>}
              <WorkOrderForm
                cancelHref="/solicitudes"
                clients={clientsResult.data}
                endpoint={`/api/admin/solicitudes/${encodeURIComponent(request.folio)}/aceptar`}
                initialClient={{
                  type: request.company ? "empresa" : "persona",
                  name: request.company ?? request.clientName,
                  contact: request.company ? request.clientName : undefined,
                  rut: request.rut,
                  phone: request.phone,
                  email: request.email,
                }}
                initialPiece={request.piece}
                initialWork={request.requestedWork}
                receivedDate={todayInChile()}
                submitLabel="Aceptar y crear OT"
                suggestedClientId={suggestedClientId}
              />
            </div>
          )}
        </div>

        <aside className="decision-column">
          <div className="notice-box"><strong>La fecha solicitada no es un compromiso</strong><span>La fecha de entrega solo se guarda si el taller la confirma en el formulario de la OT.</span></div>
          <RequestDecisionActions canConvert={canConvert} folio={request.folio} />
        </aside>
      </section>
    </AppShell>
  );
}
