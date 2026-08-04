import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/src/components/app-shell";
import { StatusBadge } from "@/src/components/status-badge";
import { clients, requests } from "@/src/data/mock-data";
import { requestStatusLabel } from "@/src/lib/format";

export function generateStaticParams() {
  return requests.map((request) => ({ folio: request.folio }));
}

export default async function RequestDetailPage({ params }: { params: Promise<{ folio: string }> }) {
  const { folio } = await params;
  const request = requests.find((item) => item.folio === folio);
  if (!request) notFound();
  const possibleClient = clients.find((client) => client.id === request.possibleClientId);

  return (
    <AppShell active="solicitudes" eyebrow={request.folio} title="Revisar solicitud" action={<StatusBadge label={requestStatusLabel[request.status]} tone={request.status} />}>
      <section className="detail-layout">
        <div className="panel-card">
          <div className="section-heading"><div><span className="eyebrow">Información original</span><h2>Datos enviados por el cliente</h2></div><button className="button button-secondary" type="button">Corregir datos</button></div>
          <dl className="detail-list">
            <div><dt>Nombre</dt><dd>{request.clientName}</dd></div>
            <div><dt>Teléfono</dt><dd><a href={`tel:${request.phone}`}>{request.phone}</a></dd></div>
            <div><dt>Pieza</dt><dd>{request.piece}</dd></div>
            <div><dt>Trabajo solicitado</dt><dd>{request.requestedWork}</dd></div>
            <div><dt>Fecha solicitada</dt><dd>{request.requestedDate ?? "Sin fecha indicada"}</dd></div>
            <div><dt>Observaciones</dt><dd>{request.notes ?? "Sin observaciones"}</dd></div>
          </dl>
        </div>

        <aside className="decision-column">
          {possibleClient && <div className="notice-box"><strong>Posible cliente existente</strong><span>{possibleClient.name} · mismo teléfono</span><Link href="/clientes">Revisar coincidencia</Link></div>}
          <div className="panel-card compact-card">
            <h2>Datos para aceptar</h2>
            <label>Fecha real de recepción<input type="date" defaultValue="2026-08-04" /></label>
            <label>Fecha comprometida <small>Opcional</small><input type="date" /></label>
            <label>Prioridad<select defaultValue="normal"><option value="baja">Baja</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></label>
            <Link className="button button-primary button-block" href={`/trabajos/nuevo?solicitud=${request.folio}`}>Aceptar y crear OT</Link>
            <Link className="button button-secondary button-block" href={`/cotizaciones/nueva?solicitud=${request.folio}`}>Cotizar primero</Link>
            <div className="split-actions"><button className="text-button" type="button">Pedir información</button><button className="text-button danger" type="button">Rechazar</button></div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
