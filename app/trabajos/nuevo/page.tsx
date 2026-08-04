import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/src/components/app-shell";
import { clients } from "@/src/data/mock-data";

export const metadata: Metadata = { title: "Nuevo trabajo" };

export default function NewWorkOrderPage() {
  return (
    <AppShell active="trabajos" eyebrow="Orden de trabajo manual" title="Nuevo trabajo">
      <div className="form-page">
        <section className="panel-card form-section">
          <div><span className="eyebrow">1 de 2</span><h2>Cliente y trabajo</h2><p>Busca un cliente existente antes de crear otro.</p></div>
          <label>Cliente<select defaultValue="cli-carolina">{clients.map((client) => <option value={client.id} key={client.id}>{client.name} · {client.phone}</option>)}</select></label>
          <button className="text-button align-start" type="button">＋ Crear cliente nuevo</button>
          <div className="form-grid">
            <label>Pieza o conjunto<input defaultValue="Soporte de motor" /></label>
            <label>Cantidad<input defaultValue="2" inputMode="numeric" min="1" step="1" type="number" /></label>
          </div>
          <label>Trabajo a realizar<textarea defaultValue="Reforzar unión y soldar fisura lateral." rows={4} /></label>
        </section>
        <section className="panel-card form-section">
          <div><span className="eyebrow">2 de 2</span><h2>Planificación</h2></div>
          <div className="form-grid">
            <label>Fecha de recepción<input type="date" defaultValue="2026-08-04" /></label>
            <label>Fecha comprometida <small>Opcional</small><input type="date" /></label>
            <label>Prioridad<select defaultValue="normal"><option value="baja">Baja</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></label>
            <label>Estado<select defaultValue="pendiente"><option value="pendiente">Pendiente</option><option value="en_proceso">En proceso</option><option value="esperando_material">Esperando material</option></select></label>
          </div>
          <label>Observaciones internas <small>No aparecen en documentos del cliente</small><textarea rows={3} /></label>
          <div className="form-actions"><Link className="button button-secondary" href="/trabajos">Cancelar</Link><Link className="button button-primary" href="/trabajos/OT-2026-0008">Guardar OT de demostración</Link></div>
        </section>
      </div>
    </AppShell>
  );
}
