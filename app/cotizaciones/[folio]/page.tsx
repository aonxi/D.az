import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/src/components/app-shell";
import { StatusBadge } from "@/src/components/status-badge";
import { tallerConfig } from "@/src/config/taller.config";
import { clients, quotes } from "@/src/data/mock-data";
import { formatClp, formatDate, quoteStatusLabel } from "@/src/lib/format";

export function generateStaticParams() { return quotes.map((quote) => ({ folio: quote.folio })); }

export default async function QuoteDetailPage({ params }: { params: Promise<{ folio: string }> }) {
  const { folio } = await params;
  const quote = quotes.find((item) => item.folio === folio);
  if (!quote) notFound();
  const client = clients.find((item) => item.name === quote.clientName) ?? clients[1];
  return (
    <AppShell active="cotizaciones" eyebrow={`${quote.folio} · versión ${quote.version}`} title="Vista previa de cotización" action={<StatusBadge label={quoteStatusLabel[quote.status]} tone={quote.status} />}>
      <div className="document-actions"><Link className="button button-secondary" href="/cotizaciones">Volver al centro</Link><button className="button button-secondary" type="button">Descargar PDF</button><button className="button button-primary" type="button">Crear nueva versión</button></div>
      <article className="pdf-preview" aria-label="Vista previa de cotización">
        <header className="pdf-header"><div className="pdf-brand"><span className="pdf-logo">LOGO</span><span><strong>{tallerConfig.identidad.razonSocial}</strong><small>RUT {tallerConfig.identidad.rut}</small><small>{tallerConfig.contacto.direccion}, {tallerConfig.contacto.comuna}</small><small>{tallerConfig.contacto.telefono} · {tallerConfig.contacto.correo}</small></span></div><div className="pdf-id"><h2>COTIZACIÓN</h2><strong>{quote.folio} · v{quote.version}</strong><small>Emisión: {quote.issuedDate ? formatDate(quote.issuedDate) : "Al emitir"}</small><small>Vence: {quote.expiresDate ? formatDate(quote.expiresDate) : "30 días después"}</small>{quote.reference && <small>Ref.: {quote.reference}</small>}</div></header>
        <section className="pdf-section"><h3>Cliente</h3><div className="pdf-client"><span><strong>{client.name}</strong><small>{client.rut ? `RUT ${client.rut}` : "RUT no informado"}</small><small>{client.phone}</small></span><span><small>{client.email ?? "Correo no informado"}</small><small>{client.address ?? "Dirección no informada"}</small></span></div></section>
        <div className="table-scroll"><table><thead><tr><th>Ítem</th><th>Descripción</th><th>Cant.</th><th>Precio unitario neto</th><th>Subtotal</th></tr></thead><tbody><tr><td>1</td><td><strong>Soporte de motor</strong><br />Reparación y soldadura de fisura lateral.</td><td>2</td><td>{formatClp(75000)}</td><td>{formatClp(150000)}</td></tr></tbody></table></div>
        <section className="pdf-bottom"><div className="pdf-conditions"><h3>Condiciones</h3><p><strong>Validez:</strong> {tallerConfig.cotizacion.vigenciaDias} días corridos</p><p><strong>Formas de pago:</strong> {tallerConfig.cotizacion.formasPago.join(", ")}</p><p><strong>Pago:</strong> {tallerConfig.cotizacion.condicionesPago}</p><p><strong>Entrega:</strong> Sin fecha comprometida</p></div><dl className="totals-list"><div><dt>Subtotal</dt><dd>{formatClp(quote.net)}</dd></div><div><dt>Neto</dt><dd>{formatClp(quote.net)}</dd></div><div><dt>IVA 19 %</dt><dd>{formatClp(quote.vat)}</dd></div><div className="total-row"><dt>Total</dt><dd>{formatClp(quote.total)}</dd></div><div><dt>Anticipo requerido</dt><dd>{formatClp(quote.deposit)}</dd></div></dl></section>
        <section className="pdf-section"><h3>Observaciones</h3><p>La reparación se realizará una vez confirmadas las medidas y el estado de la pieza.</p></section>
        <footer className="pdf-footer"><span>{tallerConfig.cotizacion.textoAgradecimiento}</span><span>{tallerConfig.cotizacion.leyendaComercial}</span></footer>
      </article>
    </AppShell>
  );
}
