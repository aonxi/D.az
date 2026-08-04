"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client";

export function LoginForm({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || submitting) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    setSubmitting(true);
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      setMessage("No pudimos iniciar sesión. Revisa los datos e inténtalo nuevamente.");
      setSubmitting(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("perfiles_admin")
      .select("id")
      .eq("id", data.user.id)
      .eq("activo", true)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setMessage("Esta cuenta no tiene acceso administrativo activo.");
      setSubmitting(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  if (!enabled) {
    return (
      <div className="form-stack">
        <p className="form-message">
          El acceso real está preparado, pero este entorno continúa en modo demostración hasta conectar un proyecto de Supabase de pruebas.
        </p>
        <Link className="button button-primary button-block" href="/">
          Entrar a la demostración
        </Link>
      </div>
    );
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <label htmlFor="admin-email">
        Correo
        <input id="admin-email" name="email" type="email" autoComplete="username" required />
      </label>
      <label htmlFor="admin-password">
        Contraseña
        <input id="admin-password" name="password" type="password" autoComplete="current-password" required />
      </label>
      {message && <p className="form-message error" role="alert">{message}</p>}
      <button className="button button-primary button-block" disabled={submitting} type="submit">
        {submitting ? "Comprobando…" : "Iniciar sesión"}
      </button>
      <Link className="text-button" href="/recuperar-acceso">Recuperar acceso</Link>
    </form>
  );
}
