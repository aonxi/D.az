"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client";

export function UpdatePasswordForm({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || submitting) return;

    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setSubmitting(true);
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage("No fue posible actualizar la contraseña. Solicita un enlace nuevo.");
      setSubmitting(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <label htmlFor="new-password">
        Nueva contraseña
        <input id="new-password" name="password" type="password" minLength={12} autoComplete="new-password" required disabled={!enabled} />
      </label>
      <small>Utiliza al menos 12 caracteres y evita reutilizar contraseñas.</small>
      {message && <p className="form-message error" role="alert">{message}</p>}
      <button className="button button-primary button-block" disabled={!enabled || submitting} type="submit">
        {submitting ? "Actualizando…" : "Actualizar contraseña"}
      </button>
    </form>
  );
}
