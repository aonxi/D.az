import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/src/components/app-shell";
import { StatusBadge } from "@/src/components/status-badge";
import { workOrders } from "@/src/data/mock-data";
import { formatDate, priorityLabel, sortRecommended, workStatusLabel } from "@/src/lib/format";

export const metadata: Metadata = { title: "Trabajos" };

export default function WorkOrdersPage() {
  const ordered = sortRecommended(workOrders.filter((work) => !["entregado", "cancelado"].includes(work.status)));
  return (
    <AppShell active="trabajos" eyebrow="Cola operativa" title="Trabajos" action={<Link className="button button-primary" href="/trabajos/nuevo">Nuevo trabajo</Link>}>
      <div className="toolbar">
        <label>Estado<select defaultValue="activos"><option value="activos">Activos</option><option>Pendientes</option><option>En proceso</option><option>Listos</option></select></label>
        <label>Prioridad<select defaultValue="todas"><option value="todas">Todas</option><option>Urgente</option><option>Alta</option><option>Normal</option><option>Baja</option></select></label>
        <label>Orden<select defaultValue="recomendado"><option value="recomendado">Recomendado</option><option value="manual">Manual</option></select></label>
      </div>
      <div className="queue-note"><strong>Orden recomendado</strong><span>Prioridad, fecha comprometida y antigüedad. Los trabajos sin fecha no se consideran atrasados.</span></div>
      <div className="list-card work-list">
        {ordered.map((work, index) => {
          const overdue = Boolean(work.dueDate && work.dueDate < "2026-08-04" && !["listo", "entregado", "cancelado"].includes(work.status));
          return (
            <Link className="list-row" href={`/trabajos/${work.folio}`} key={work.folio}>
              <span className="queue-number" aria-label={`Posición ${index + 1}`}>{index + 1}</span>
              <span className="list-main"><strong>{work.folio} · {work.work}</strong><small>{work.clientName} · {work.piece} · {work.quantity} {work.quantity === 1 ? "unidad" : "unidades"}</small><span className="badge-row"><StatusBadge label={workStatusLabel[work.status]} tone={work.status} /><StatusBadge label={priorityLabel[work.priority]} tone={work.priority} /></span></span>
              <span className={overdue ? "list-side overdue" : "list-side"}><strong>{work.dueDate ? formatDate(work.dueDate) : "Sin fecha comprometida"}</strong>{overdue && <small>Atrasado</small>}</span>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
