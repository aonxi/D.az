import type { Metadata } from "next";
import { PublicShell } from "@/src/components/public-shell";
import { UpdatePasswordForm } from "@/src/features/auth/update-password-form";
import { hasSupabaseConfig, isDemoMode } from "@/src/lib/supabase/config";

export const metadata: Metadata = { title: "Actualizar contraseña" };

export default function UpdatePasswordPage() {
  const enabled = !isDemoMode() && hasSupabaseConfig();

  return (
    <PublicShell>
      <section className="public-card login-card">
        <span className="eyebrow">Seguridad</span>
        <h1>Crear nueva contraseña</h1>
        <p>Este enlace es temporal y solo funciona después de una solicitud de recuperación válida.</p>
        <UpdatePasswordForm enabled={enabled} />
      </section>
    </PublicShell>
  );
}
