import type { Metadata } from "next";
import { PublicShell } from "@/src/components/public-shell";

export const metadata: Metadata = { title: "Enviar solicitud" };

export default function PublicRequestPage() {
  return (
    <PublicShell>
      <section className="public-card">
        <span className="eyebrow">Formulario público</span>
        <h1>Cuéntanos qué trabajo necesitas</h1>
        <p>El taller revisará la información antes de confirmar precio, recepción de la pieza o fecha de entrega.</p>
        <form action="/solicitud/confirmacion" className="form-stack">
          <label>Nombre <span aria-hidden="true">*</span><input name="nombre" required placeholder="Nombre y apellido" /></label>
          <label>Teléfono <span aria-hidden="true">*</span><input name="telefono" required inputMode="tel" placeholder="+56 9 1234 5678" /></label>
          <label>Pieza o conjunto <span aria-hidden="true">*</span><input name="pieza" required placeholder="Ej. eje de portón" /></label>
          <label>Trabajo solicitado <span aria-hidden="true">*</span><textarea name="trabajo" required rows={4} placeholder="Describe lo que necesitas realizar" /></label>
          <div className="form-grid">
            <label>Empresa <small>Opcional</small><input name="empresa" /></label>
            <label>RUT <small>Opcional</small><input name="rut" /></label>
            <label>Correo <small>Opcional</small><input name="correo" type="email" /></label>
            <label>Fecha en que lo necesita <small>Opcional</small><input name="fecha-solicitada" type="date" /></label>
          </div>
          <label>Observaciones <small>Opcional</small><textarea name="observaciones" rows={3} /></label>
          <label className="check-row"><input name="consentimiento" type="checkbox" required /><span>Autorizo al taller a usar estos datos para revisar y responder mi solicitud.</span></label>
          <button className="button button-primary button-block" type="submit">Enviar solicitud</button>
          <p className="form-footnote">Este formulario de la Etapa 1 es una demostración: no envía ni almacena información.</p>
        </form>
      </section>
    </PublicShell>
  );
}
