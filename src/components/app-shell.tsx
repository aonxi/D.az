import Link from "next/link";
import type { ReactNode } from "react";
import { StageNotice } from "@/src/components/stage-notice";

type NavKey = "inicio" | "solicitudes" | "trabajos" | "cotizaciones" | "mas";

const navItems: { key: NavKey; href: string; label: string; mark: string }[] = [
  { key: "inicio", href: "/", label: "Inicio", mark: "I" },
  { key: "solicitudes", href: "/solicitudes", label: "Solicitudes", mark: "S" },
  { key: "trabajos", href: "/trabajos", label: "Trabajos", mark: "T" },
  { key: "cotizaciones", href: "/cotizaciones", label: "Cotizaciones", mark: "C" },
  { key: "mas", href: "/mas", label: "Más", mark: "M" },
];

export function AppShell({ active, eyebrow, title, action, children }: { active: NavKey; eyebrow?: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="site-root">
      <StageNotice />
      <div className="admin-layout">
        <aside className="desktop-nav">
          <Link className="brand" href="/"><span className="brand-mark">TF</span><span><strong>TallerFlow</strong><small>Taller Demo</small></span></Link>
          <nav aria-label="Navegación principal">
            {navItems.map((item) => <Link className={item.key === active ? "nav-link active" : "nav-link"} href={item.href} key={item.key}><span aria-hidden="true">{item.mark}</span>{item.label}</Link>)}
          </nav>
          <div className="demo-identity"><small>Sesión simulada</small><strong>Propietario del taller</strong><Link href="/login">Cerrar demostración</Link></div>
        </aside>
        <div className="app-column">
          <header className="topbar">
            <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1></div>
            {action}
          </header>
          <main className="page-content">{children}</main>
          <nav className="mobile-nav" aria-label="Navegación móvil">
            {navItems.map((item) => <Link className={item.key === active ? "mobile-link active" : "mobile-link"} href={item.href} key={item.key}><span aria-hidden="true">{item.mark}</span><small>{item.label}</small></Link>)}
          </nav>
        </div>
      </div>
    </div>
  );
}
