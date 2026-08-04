"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client";

const GENERIC_MESSAGE = "Si el correo está habilitado, recibirás instrucciones para recuperar el acceso.";

export function RecoveryForm({ enabled }: { enabled: boolean }) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || submitting) return;

    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/actualizar-contrasena`,
      });
    } finally {
      setMessage(GENERIC_MESSAGE);
      setSubmitting(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <label htmlFor="recovery-email">
        Correo administrativo
        <input id="recovery-email" name="email" type="email" autoComplete="email" required disabled={!enabled} />
      </label>
      {message && <p className="form-message success" role="status">{message}</p>}
      {!enabled && <p className="form-message">La recuperación se habilitará al conectar Supabase.</p>}
      <button className="button button-primary button-block" disabled={!enabled || submitting} type="submit">
        {submitting ? "Enviando…" : "Enviar instrucciones"}
      </button>
    </form>
  );
}
