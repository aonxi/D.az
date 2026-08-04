import Link from "next/link";
import type { Metadata } from "next";
import { PublicShell } from "@/src/components/public-shell";
import { RecoveryForm } from "@/src/features/auth/recovery-form";
import { hasSupabaseConfig, isDemoMode } from "@/src/lib/supabase/config";

export const metadata: Metadata = { title: "Recuperar acceso" };

export default function RecoveryPage() {
  const enabled = !isDemoMode() && hasSupabaseConfig();

  return (
    <PublicShell>
      <section className="public-card login-card">
        <span className="eyebrow">Seguridad</span>
        <h1>Recuperar acceso</h1>
        <p>Por privacidad, la respuesta será la misma exista o no una cuenta asociada al correo.</p>
        <RecoveryForm enabled={enabled} />
        <Link className="text-button" href="/login">Volver al acceso</Link>
      </section>
    </PublicShell>
  );
}
