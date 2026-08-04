import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/src/components/app-shell";
import { requests, workOrders } from "@/src/data/mock-data";

export const metadata: Metadata = { title: "Buscar" };

export default function SearchPage() {
  return <AppShell active="inicio" eyebrow="Resultados simulados" title="Buscar"><form action="/buscar" className="search-box" role="search"><label className="sr-only" htmlFor="search-again">Buscar</label><input id="search-again" name="q" defaultValue="eje" /><button className="button button-primary" type="submit">Buscar</button></form><section><div className="section-heading"><div><span className="eyebrow">Coincidencias</span><h2>Trabajos</h2></div></div><div className="list-card">{workOrders.filter((work) => work.piece.toLowerCase().includes("eje")).map((work) => <Link className="list-row" href={`/trabajos/${work.folio}`} key={work.folio}><span className="list-main"><strong>{work.folio} · {work.piece}</strong><small>{work.clientName} · {work.work}</small></span><span aria-hidden="true">›</span></Link>)}</div></section><section><div className="section-heading"><div><span className="eyebrow">Coincidencias</span><h2>Solicitudes</h2></div></div><div className="list-card">{requests.filter((request) => request.piece.toLowerCase().includes("eje")).map((request) => <Link className="list-row" href={`/solicitudes/${request.folio}`} key={request.folio}><span className="list-main"><strong>{request.folio} · {request.piece}</strong><small>{request.clientName} · {request.requestedWork}</small></span><span aria-hidden="true">›</span></Link>)}</div></section></AppShell>;
}
