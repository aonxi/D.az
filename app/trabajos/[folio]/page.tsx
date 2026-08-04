import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/src/components/app-shell";
import { StatusBadge } from "@/src/components/status-badge";
import { quotes, workOrders } from "@/src/data/mock-data";
import { formatClp, formatDate, priorityLabel, quoteStatusLabel, workStatusLabel } from "@/src/lib/format";

export function generateStaticParams() {
  return workOrders.map((work) => ({ folio: work.folio }));
}

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ folio: string }> }) {
  const { folio } = await params;
  const work = workOrders.find((item) => item.folio === folio);
  if (!work) notFound();
  const relatedQuotes = quotes.filter((quote) => quote.reference === work.folio);
  return (
    <AppShell active="trabajos" eyebrow={work.folio} title={work.work} action={<Link className="button button-secondary" href="/trabajos/nuevo">Editar</Link>}>
      <section className="detail-layout">
        <div className="detail-main">
          <div className="panel-card">
            <div className="status-controls"><label>Estado<select defaultValue={work.status}>{Object.entries(workStatusLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Prioridad<select defaultValue={work.priority}>{Object.entries(priorityLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
            <div className="contact-strip"><div><span className="eyebrow">Cliente</span><h2>{work.clientName}</h2><a href={`tel:${work.phone}`}>{work.phone}</a></div><a className="button button-secondary" href={`tel:${work.phone}`}>Llamar</a></div>
            <dl className="detail-list">
              <div><dt>Pieza</dt><dd>{work.piece}</dd></div>
              <div><dt>Trabajo</dt><dd>{work.work}</dd></div>
              <div><dt>Cantidad</dt><dd>{work.quantity} {work.quantity === 1 ? "unidad" : "unidades"}</dd></div>
              <div><dt>Recepción</dt><dd>{formatDate(work.receivedDate)}</dd></div>
              <div><dt>Entrega</dt><dd>{work.dueDate ? formatDate(work.dueDate) : "Sin fecha comprometida"}</dd></div>
              <div><dt>Origen</dt><dd>{work.origin}</dd></div>
              <div><dt>Observaciones internas</dt><dd>{work.notes ?? "Sin observaciones"}</dd></div>
            </dl>
          </div>
          <section>
            <div className="section-heading"><div><span className="eyebrow">Historial comercial</span><h2>Cotizaciones relacionadas</h2></div><Link className="button button-primary" href={`/cotizaciones/nueva?ot=${work.folio}`}>Generar cotización</Link></div>
            {relatedQuotes.length ? <div className="list-card">{relatedQuotes.map((quote) => <Link className="list-row" href={`/cotizaciones/${quote.folio}`} key={quote.folio}><span className="list-main"><strong>{quote.folio} · v{quote.version}</strong><small>{formatClp(quote.total)} total</small></span><StatusBadge label={quoteStatusLabel[quote.status]} tone={quote.status} /></Link>)}</div> : <div className="empty-state"><strong>Aún no hay cotizaciones</strong><span>Puedes crear la primera sin volver a escribir los datos de esta OT.</span></div>}
          </section>
        </div>
        <aside className="decision-column"><div className="panel-card compact-card"><span className="eyebrow">Estado actual</span><StatusBadge label={workStatusLabel[work.status]} tone={work.status} /><StatusBadge label={priorityLabel[work.priority]} tone={work.priority} /><button className="button button-primary button-block" type="button">Marcar en proceso</button><button className="button button-secondary button-block" type="button">Marcar listo</button></div></aside>
      </section>
    </AppShell>
  );
}
