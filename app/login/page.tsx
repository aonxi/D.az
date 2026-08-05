import type { Metadata } from "next";
import { PublicShell } from "@/src/components/public-shell";
import { LoginForm } from "@/src/features/auth/login-form";
import { hasSupabaseConfig, isDemoMode } from "@/src/lib/supabase/config";

export const metadata: Metadata = { title: "Acceso administrador" };

export default function LoginPage() {
  const enabled = !isDemoMode() && hasSupabaseConfig();

  return (
    <PublicShell>
      <section className="public-card login-card">
        <span className="eyebrow">Administración</span>
        <h1>Acceder a TallerFlow</h1>
        <p>El registro público está deshabilitado. Solo una cuenta administrativa creada de forma controlada puede acceder.</p>
        <LoginForm enabled={enabled} />
      </section>
    </PublicShell>
  );
}
