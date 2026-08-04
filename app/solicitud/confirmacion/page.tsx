import Link from "next/link";
import type { Metadata } from "next";
import { PublicShell } from "@/src/components/public-shell";

export const metadata: Metadata = { title: "Solicitud recibida" };

export default function ConfirmationPage() {
  return (
    <PublicShell>
      <section className="public-card confirmation-card">
        <span className="confirmation-mark" aria-hidden="true">✓</span>
        <span className="eyebrow">Demostración</span>
        <h1>Solicitud recibida</h1>
        <p className="folio-display">SOL-2026-0015</p>
        <p>El taller debe revisar tu solicitud. Este envío todavía no confirma precio, recepción de la pieza ni fecha de entrega.</p>
        <div className="notice-box"><strong>Guarda este folio</strong><span>Podrás mencionarlo cuando contactes al taller.</span></div>
        <Link className="button button-primary" href="/solicitud">Realizar otra solicitud</Link>
      </section>
    </PublicShell>
  );
}
