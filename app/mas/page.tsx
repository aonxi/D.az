import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/src/components/app-shell";

export const metadata: Metadata = { title: "Más" };

export default function MorePage() {
  return <AppShell active="mas" eyebrow="Administración" title="Más"><div className="settings-list"><Link className="setting-row" href="/clientes"><span><strong>Clientes</strong><small>Buscar y revisar datos ficticios</small></span><span aria-hidden="true">›</span></Link><button className="setting-row" type="button"><span><strong>Exportar trabajos CSV</strong><small>Disponible funcionalmente en la Etapa 8</small></span><span aria-hidden="true">↓</span></button><button className="setting-row" type="button"><span><strong>Exportar cotizaciones CSV</strong><small>Disponible funcionalmente en la Etapa 8</small></span><span aria-hidden="true">↓</span></button><div className="setting-row"><span><strong>Ayuda y recuperación</strong><small>Las instrucciones operativas crecerán en cada etapa</small></span></div><Link className="setting-row" href="/login"><span><strong>Cerrar demostración</strong><small>No existe una sesión real en esta etapa</small></span><span aria-hidden="true">›</span></Link></div></AppShell>;
}
