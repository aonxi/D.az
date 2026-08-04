import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/src/components/app-shell";
import { clients, workOrders } from "@/src/data/mock-data";
import { tallerConfig } from "@/src/config/taller.config";

export const metadata: Metadata = { title: "Nueva cotización" };

export default function NewQuotePage() {
  return (
    <AppShell active="cotizaciones" eyebrow="Editor único · Borrador" title="Nueva cotización">
      <div className="quote-editor">
        <div className="editor-main">
          <section className="panel-card form-section">
            <div className="section-heading"><div><span className="eyebrow">Origen</span><h2>Datos relacionados</h2></div><button className="button button-secondary" type="button">Cambiar origen</button></div>
            <div className="form-grid"><label>Cliente<select defaultValue="cli-carolina">{clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label><label>Orden de trabajo<select defaultValue="OT-2026-0008"><option value="">Sin OT</option>{workOrders.map((work) => <option value={work.folio} key={work.folio}>{work.folio} · {work.work}</option>)}</select></label></div>
          </section>
          <section className="panel-card form-section">
            <div className="section-heading"><div><span className="eyebrow">Detalle</span><h2>Ítems de cotización</h2></div><button className="button button-secondary" type="button">＋ Agregar ítem</button></div>
            <div className="quote-line">
              <span className="line-number">1</span>
              <div className="quote-fields"><label>Descripción<textarea defaultValue="Reparación y soldadura de soporte de motor" rows={3} /></label><div className="form-grid"><label>Cantidad<input defaultValue="2" min="1" step="1" type="number" /></label><label>Precio unitario neto<input defaultValue="75000" inputMode="numeric" /></label></div></div>
              <button className="text-button danger" type="button">Quitar</button>
            </div>
          </section>
          <section className="panel-card form-section">
            <h2>Condiciones</h2>
            <div className="form-grid"><label>Validez en días<input defaultValue={tallerConfig.cotizacion.vigenciaDias} min="1" type="number" /></label><label>Tasa IVA<input defaultValue={tallerConfig.cotizacion.tasaIvaPredeterminada} step="0.01" type="number" /></label><label>Anticipo requerido<input defaultValue={tallerConfig.cotizacion.anticipoPredeterminado} inputMode="numeric" /></label><label>Entrega estimada <small>Opcional</small><input type="date" /></label></div>
            <label>Condiciones de pago<textarea defaultValue={tallerConfig.cotizacion.condicionesPago} rows={2} /></label>
            <label>Materiales <small>Opcional</small><input placeholder="Ej. materiales incluidos en el valor" /></label>
            <label>Observaciones visibles en PDF <small>Opcional</small><textarea rows={3} /></label>
          </section>
        </div>
        <aside className="quote-summary panel-card">
          <span className="eyebrow">Resumen</span><h2>Totales</h2>
          <dl className="totals-list"><div><dt>Subtotal</dt><dd>$150.000</dd></div><div><dt>Descuento</dt><dd>$0</dd></div><div><dt>Neto</dt><dd>$150.000</dd></div><div><dt>IVA 19 %</dt><dd>$28.500</dd></div><div className="total-row"><dt>Total</dt><dd>$178.500</dd></div><div><dt>Anticipo requerido</dt><dd>$0</dd></div></dl>
          <p className="form-footnote">Los precios se ingresan netos. Los cálculos serán funcionales en la Etapa 6.</p>
          <button className="button button-secondary button-block" type="button">Guardar borrador</button>
          <Link className="button button-primary button-block" href="/cotizaciones/COT-2026-0001">Vista previa de ejemplo</Link>
        </aside>
      </div>
    </AppShell>
  );
}
