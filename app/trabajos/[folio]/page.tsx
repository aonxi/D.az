import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/src/components/app-shell";
import { StatusBadge } from "@/src/components/status-badge";
import { getWorkOrderByFolio } from "@/src/features/work-orders/repository";
import { quotes } from "@/src/data/mock-data";
import { formatClp, formatDate, priorityLabel, quoteStatusLabel, workStatusLabel } from "@/src/lib/format";

export default async function WorkOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ folio: string }>;
  searchParams: Promise<{ creada?: string; demo?: string }>;
}) {
  const { folio } = await params;
  const query = await searchParams;
  const result = await getWorkOrderByFolio(folio);
  if (result.errorReference) {
    return <AppShell active="trabajos" eyebrow={folio} title="Orden de trabajo"><div className="empty-state" role="alert"><strong>No fue posible cargar la OT</strong><span>Reintenta en unos segundos. Código: {result.errorReference}</span></div></AppShell>;
  }
  if (!result.data) notFound();
  const work = result.data;
  const relatedQuotes = quotes.filter((quote) => quote.reference === work.folio);

  return (
    <AppShell active="trabajos" eyebrow={work.folio} title={work.work} action={<Link className="button button-secondary" href="/trabajos">Volver a trabajos</Link>}>
      {query.creada === "1" && <div className="form-message success" role="status"><strong>Orden de trabajo creada correctamente.</strong>{query.demo === "1" && <span> Es una simulación y no quedó guardada.</span>}</div>}
      <section className="detail-layout">
        <div className="detail-main">
          <div className="panel-card">
            <div className="status-controls"><label>Estado<select defaultValue={work.status} disabled>{Object.entries(workStatusLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Prioridad<select defaultValue={work.priority} disabled>{Object.entries(priorityLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
            <div className="contact-strip"><div><span className="eyebrow">Cliente</span><h2>{work.clientName}</h2><a href={`tel:${work.phone}`}>{work.phone}</a></div><a className="button button-secondary" href={`tel:${work.phone}`}>Llamar</a></div>
            <dl className="detail-list">
              <div><dt>Pieza</dt><dd>{work.piece}</dd></div>
              <div><dt>Trabajo</dt><dd>{work.work}</dd></div>
              <div><dt>Cantidad</dt><dd>{work.quantity} {work.quantity === 1 ? "unidad" : "unidades"}</dd></div>
              <div><dt>Recepción</dt><dd>{formatDate(work.receivedDate)}</dd></div>
              <div><dt>Entrega</dt><dd>{work.dueDate ? formatDate(work.dueDate) : "Sin fecha comprometida"}</dd></div>
              <div><dt>Origen</dt><dd>{work.requestFolio ? <Link href={`/solicitudes/${work.requestFolio}`}>{work.requestFolio}</Link> : work.origin}</dd></div>
              <div><dt>Observaciones internas</dt><dd>{work.notes ?? "Sin observaciones"}</dd></div>
            </dl>
          </div>
          <section>
            <div className="section-heading"><div><span className="eyebrow">Historial comercial</span><h2>Cotizaciones relacionadas</h2></div><Link className="button button-primary" href={`/cotizaciones/nueva?ot=${work.folio}`}>Generar cotización</Link></div>
            {relatedQuotes.length ? <div className="list-card">{relatedQuotes.map((quote) => <Link className="list-row" href={`/cotizaciones/${quote.folio}`} key={quote.folio}><span className="list-main"><strong>{quote.folio} · v{quote.version}</strong><small>{formatClp(quote.total)} total</small></span><StatusBadge label={quoteStatusLabel[quote.status]} tone={quote.status} /></Link>)}</div> : <div className="empty-state"><strong>Aún no hay cotizaciones</strong><span>Puedes crear la primera sin volver a escribir los datos de esta OT.</span></div>}
          </section>
        </div>
        <aside className="decision-column"><div className="panel-card compact-card"><span className="eyebrow">Estado actual</span><StatusBadge label={workStatusLabel[work.status]} tone={work.status} /><StatusBadge label={priorityLabel[work.priority]} tone={work.priority} /><small>Los cambios rápidos de estado y prioridad se habilitarán con la cola operativa de la Etapa 5.</small></div></aside>
      </section>
    </AppShell>
  );
}
