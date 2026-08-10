import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/src/components/app-shell";
import { listClients } from "@/src/features/clients/repository";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientsPage() {
  const result = await listClients();

  return (
    <AppShell active="mas" eyebrow={result.isDemo ? "Datos ficticios" : "Directorio del taller"} title="Clientes" action={<Link className="button button-primary" href="/trabajos/nuevo">Nuevo trabajo y cliente</Link>}>
      <div className="toolbar"><label>Buscar<input placeholder="Nombre, RUT o teléfono" /></label><label>Tipo<select><option>Todos</option><option>Personas</option><option>Empresas</option></select></label></div>
      {result.errorReference ? (
        <div className="empty-state" role="alert"><strong>No fue posible cargar los clientes</strong><span>Reintenta en unos segundos. Código: {result.errorReference}</span></div>
      ) : result.data.length === 0 ? (
        <div className="empty-state"><strong>Aún no hay clientes</strong><span>El primer cliente puede crearse al aceptar una solicitud o registrar un trabajo manual.</span><Link className="button button-primary" href="/trabajos/nuevo">Registrar trabajo</Link></div>
      ) : (
        <div className="client-grid">{result.data.map((client) => <article className="panel-card compact-card" key={client.id}><span className="eyebrow">{client.type}</span><h2>{client.name}</h2><p>{client.rut ?? "Sin RUT"}</p><a href={`tel:${client.phone}`}>{client.phone}</a><p>{client.contact ?? client.email ?? "Sin contacto adicional"}</p><small>La ficha e historial completo se ampliarán después del circuito principal de OT.</small></article>)}</div>
      )}
    </AppShell>
  );
}
