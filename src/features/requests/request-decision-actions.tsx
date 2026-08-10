"use client";

import Link from "next/link";
import { useState } from "react";

export function RequestDecisionActions({ folio, canConvert }: { folio: string; canConvert: boolean }) {
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<"requiere_info" | "rechazada" | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function decide(status: "requiere_info" | "rechazada") {
    if (pending) return;
    if (status === "rechazada" && !window.confirm("¿Confirmas que deseas rechazar esta solicitud? El registro se conservará.")) return;
    setPending(status);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(`/api/admin/solicitudes/${encodeURIComponent(folio)}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      const result = await response.json() as { message?: string; demo?: boolean };
      if (!response.ok) {
        setIsError(true);
        setMessage(result.message ?? "No fue posible actualizar la solicitud.");
        return;
      }
      setMessage(result.demo ? "Decisión simulada. El modo demostración no guarda cambios." : "La solicitud fue actualizada.");
    } catch {
      setIsError(true);
      setMessage("No fue posible conectar con el servidor.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="panel-card compact-card">
      <h2>Decisiones administrativas</h2>
      {canConvert ? <a className="button button-primary button-block" href="#aceptar-ot">Aceptar y crear OT</a> : <span className="form-message">Esta solicitud ya no admite conversión directa.</span>}
      <Link className="button button-secondary button-block" href={`/cotizaciones/nueva?solicitud=${encodeURIComponent(folio)}`}>Cotizar primero</Link>
      <label>Nota de decisión <small>Opcional</small><textarea maxLength={2000} onChange={(event) => setNote(event.target.value)} rows={3} value={note} /></label>
      <div className="split-actions">
        <button className="text-button" disabled={Boolean(pending)} onClick={() => decide("requiere_info")} type="button">{pending === "requiere_info" ? "Guardando…" : "Pedir información"}</button>
        <button className="text-button danger" disabled={Boolean(pending)} onClick={() => decide("rechazada")} type="button">{pending === "rechazada" ? "Guardando…" : "Rechazar"}</button>
      </div>
      {message && <p className={`form-message ${isError ? "error" : "success"}`} role="status">{message}</p>}
    </div>
  );
}
