import Link from "next/link";
import { AppShell } from "@/src/components/app-shell";
import { StatusBadge } from "@/src/components/status-badge";
import { dashboardCounts, recommendedWork, workOrders } from "@/src/data/mock-data";
import { formatDate, priorityLabel } from "@/src/lib/format";

export default function Home() {
  return (
    <AppShell active="inicio" eyebrow="Martes, 4 de agosto" title="Inicio">
      <form action="/buscar" className="search-box" role="search">
        <label className="sr-only" htmlFor="global-search">Buscar</label>
        <input id="global-search" name="q" placeholder="Buscar por folio, cliente, teléfono o pieza" />
        <button className="button button-secondary" type="submit">Buscar</button>
      </form>

      <section className="metrics" aria-label="Resumen del taller">
        <Link className="metric" href="/solicitudes"><span>Solicitudes nuevas</span><strong>{dashboardCounts.newRequests}</strong></Link>
        <Link className="metric" href="/trabajos"><span>Para hoy</span><strong>{dashboardCounts.today}</strong></Link>
        <Link className="metric metric-alert" href="/trabajos"><span>Atrasados</span><strong>{dashboardCounts.overdue}</strong></Link>
        <Link className="metric" href="/trabajos"><span>Listos para entregar</span><strong>{dashboardCounts.ready}</strong></Link>
      </section>

      <section className="quick-actions" aria-label="Acciones principales">
        <Link className="action-card action-primary" href="/trabajos/nuevo"><span className="action-mark" aria-hidden="true">＋</span><span><strong>Nuevo trabajo</strong><small>Registrar una OT presencial o telefónica</small></span></Link>
        <Link className="action-card" href="/cotizaciones/nueva"><span className="action-mark" aria-hidden="true">$</span><span><strong>Generar cotización</strong><small>Desde OT, solicitud, cliente o cero</small></span></Link>
      </section>

      <section className="panel-card recommendation">
        <div className="section-heading">
          <div><span className="eyebrow">Próximo recomendado</span><h2>{recommendedWork.folio}</h2></div>
          <StatusBadge label={priorityLabel[recommendedWork.priority]} tone="urgent" />
        </div>
        <h3>{recommendedWork.work}</h3>
        <p>{recommendedWork.clientName} · {recommendedWork.piece}</p>
        <p className="reason">Primero por prioridad urgente y entrega comprometida para hoy.</p>
        <Link className="button button-primary" href={`/trabajos/${recommendedWork.folio}`}>Abrir trabajo</Link>
      </section>

      <section>
        <div className="section-heading"><div><span className="eyebrow">Operación</span><h2>Cola activa</h2></div><Link href="/trabajos">Ver todos</Link></div>
        <div className="list-card">
          {workOrders.slice(0, 4).map((work) => (
            <Link className="list-row" href={`/trabajos/${work.folio}`} key={work.folio}>
              <span className="list-main"><strong>{work.folio} · {work.work}</strong><small>{work.clientName} · {work.piece}</small></span>
              <span className="list-side"><StatusBadge label={priorityLabel[work.priority]} tone={work.priority} /><small>{work.dueDate ? formatDate(work.dueDate) : "Sin fecha comprometida"}</small></span>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
