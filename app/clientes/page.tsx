import type { Metadata } from "next";
import { AppShell } from "@/src/components/app-shell";
import { clients } from "@/src/data/mock-data";

export const metadata: Metadata = { title: "Clientes" };

export default function ClientsPage() {
  return <AppShell active="mas" eyebrow="Datos ficticios" title="Clientes" action={<button className="button button-primary" type="button">Nuevo cliente</button>}><div className="toolbar"><label>Buscar<input placeholder="Nombre, RUT o teléfono" /></label><label>Tipo<select><option>Todos</option><option>Personas</option><option>Empresas</option></select></label></div><div className="client-grid">{clients.map((client) => <article className="panel-card compact-card" key={client.id}><span className="eyebrow">{client.type}</span><h2>{client.name}</h2><p>{client.rut ?? "Sin RUT"}</p><a href={`tel:${client.phone}`}>{client.phone}</a><p>{client.contact ?? client.email ?? "Sin contacto adicional"}</p><button className="button button-secondary button-block" type="button">Abrir ficha</button></article>)}</div></AppShell>;
}
