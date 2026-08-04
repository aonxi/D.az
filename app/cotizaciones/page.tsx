import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/src/components/app-shell";
import { StatusBadge } from "@/src/components/status-badge";
import { quotes } from "@/src/data/mock-data";
import { formatClp, formatDate, quoteStatusLabel } from "@/src/lib/format";

export const metadata: Metadata = { title: "Cotizaciones" };

export default function QuotesPage() {
  return (
    <AppShell active="cotizaciones" eyebrow="Documentos comerciales" title="Cotizaciones" action={<Link className="button button-primary" href="/cotizaciones/nueva">Generar cotización</Link>}>
      <div className="toolbar"><label>Estado<select defaultValue="todas"><option value="todas">Todas</option><option>Borradores</option><option>Emitidas</option><option>Aprobadas</option></select></label><label>Orden<select><option>Más recientes</option><option>Por cliente</option><option>Por total</option></select></label></div>
      <div className="list-card">
        {quotes.map((quote) => <Link className="list-row" href={`/cotizaciones/${quote.folio}`} key={quote.folio}><span className="list-main"><strong>{quote.folio} · v{quote.version}</strong><small>{quote.clientName} · {quote.reference ?? "Sin OT"}</small></span><span className="list-side"><strong>{formatClp(quote.total)}</strong><StatusBadge label={quoteStatusLabel[quote.status]} tone={quote.status} />{quote.issuedDate && <small>{formatDate(quote.issuedDate)}</small>}</span></Link>)}
      </div>
    </AppShell>
  );
}
