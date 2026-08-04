import Link from "next/link";
import type { Metadata } from "next";
import { PublicShell } from "@/src/components/public-shell";

export const metadata: Metadata = { title: "Acceso administrador" };

export default function LoginPage() {
  return (
    <PublicShell>
      <section className="public-card login-card">
        <span className="eyebrow">Administración</span>
        <h1>Acceder a TallerFlow</h1>
        <p>La autenticación real se implementará en la Etapa 2. Por ahora puedes entrar a la demostración navegable.</p>
        <form className="form-stack">
          <label>Correo<input type="email" value="propietario@demo.local" readOnly /></label>
          <label>Contraseña<input type="password" value="demostracion" readOnly /></label>
          <Link className="button button-primary button-block" href="/">Entrar a la demostración</Link>
          <button className="text-button" type="button">Recuperar acceso</button>
        </form>
      </section>
    </PublicShell>
  );
}
