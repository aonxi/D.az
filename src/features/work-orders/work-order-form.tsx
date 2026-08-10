"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { Client, Priority, WorkStatus } from "@/src/types/domain";

type InitialClient = {
  type: "persona" | "empresa";
  name: string;
  rut?: string;
  contact?: string;
  phone: string;
  email?: string;
  address?: string;
};

type WorkOrderFormProps = {
  endpoint: string;
  clients: Client[];
  suggestedClientId?: string;
  initialClient?: InitialClient;
  initialPiece?: string;
  initialWork?: string;
  receivedDate: string;
  cancelHref: string;
  submitLabel: string;
};

type ApiResponse = {
  message?: string;
  errors?: Record<string, string>;
  otFolio?: string;
  demo?: boolean;
};

function value(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

export function WorkOrderForm({
  endpoint,
  clients,
  suggestedClientId,
  initialClient,
  initialPiece = "",
  initialWork = "",
  receivedDate,
  cancelHref,
  submitLabel,
}: WorkOrderFormProps) {
  const defaultExistingId = suggestedClientId ?? clients[0]?.id ?? "";
  const [clientMode, setClientMode] = useState<"existing" | "new">(
    defaultExistingId ? "existing" : "new",
  );
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = new FormData(event.currentTarget);
    const key = idempotencyKey || crypto.randomUUID();
    if (!idempotencyKey) setIdempotencyKey(key);
    setPending(true);
    setErrors({});
    setMessage("");

    const payload = {
      idempotencyKey: key,
      client: {
        mode: clientMode,
        existingId: clientMode === "existing" ? value(form, "existingClientId") : null,
        type: value(form, "clientType"),
        name: value(form, "clientName"),
        rut: value(form, "clientRut"),
        contact: value(form, "clientContact"),
        phone: value(form, "clientPhone"),
        email: value(form, "clientEmail"),
        address: value(form, "clientAddress"),
        notes: value(form, "clientNotes"),
      },
      piece: value(form, "piece"),
      work: value(form, "work"),
      quantity: Number(value(form, "quantity")),
      receivedDate: value(form, "receivedDate"),
      dueDate: value(form, "dueDate"),
      priority: value(form, "priority") as Priority,
      status: value(form, "status") as WorkStatus,
      notes: value(form, "notes"),
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as ApiResponse;
      if (!response.ok || !result.otFolio) {
        setErrors(result.errors ?? {});
        setMessage(result.message ?? "No fue posible guardar la orden de trabajo.");
        return;
      }
      window.location.assign(`/trabajos/${encodeURIComponent(result.otFolio)}?creada=1${result.demo ? "&demo=1" : ""}`);
    } catch {
      setMessage("No fue posible conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form-page" onSubmit={submit}>
      <section className="panel-card form-section">
        <div>
          <span className="eyebrow">1 de 2</span>
          <h2>Cliente y trabajo</h2>
          <p>Selecciona un cliente existente o crea uno sin alterar los datos originales de la solicitud.</p>
        </div>

        <fieldset className="choice-group">
          <legend>Resolución del cliente</legend>
          <label className="choice-card">
            <input checked={clientMode === "existing"} disabled={clients.length === 0} name="clientMode" onChange={() => setClientMode("existing")} type="radio" />
            <span><strong>Usar cliente existente</strong><small>Reutiliza sus datos sin crear duplicados.</small></span>
          </label>
          <label className="choice-card">
            <input checked={clientMode === "new"} name="clientMode" onChange={() => setClientMode("new")} type="radio" />
            <span><strong>Crear cliente nuevo</strong><small>Úsalo solo después de revisar las coincidencias.</small></span>
          </label>
        </fieldset>

        {clientMode === "existing" ? (
          <label>
            Cliente
            <select defaultValue={defaultExistingId} name="existingClientId" required>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name} · {client.phone}</option>
              ))}
            </select>
            {suggestedClientId && <small>Coincidencia sugerida por teléfono, RUT o vínculo previo. Revísala antes de guardar.</small>}
            {errors.client && <span className="field-error">{errors.client}</span>}
          </label>
        ) : (
          <div className="form-grid client-fields">
            <label>Tipo<select defaultValue={initialClient?.type ?? "persona"} name="clientType"><option value="persona">Persona</option><option value="empresa">Empresa</option></select></label>
            <label>Nombre o razón social<input defaultValue={initialClient?.name} maxLength={180} name="clientName" required />{errors.clientName && <span className="field-error">{errors.clientName}</span>}</label>
            <label>RUT <small>Opcional</small><input defaultValue={initialClient?.rut} maxLength={20} name="clientRut" /></label>
            <label>Persona de contacto <small>Opcional</small><input defaultValue={initialClient?.contact} maxLength={160} name="clientContact" /></label>
            <label>Teléfono<input defaultValue={initialClient?.phone} inputMode="tel" maxLength={30} name="clientPhone" required />{errors.clientPhone && <span className="field-error">{errors.clientPhone}</span>}</label>
            <label>Correo <small>Opcional</small><input defaultValue={initialClient?.email} maxLength={254} name="clientEmail" type="email" />{errors.clientEmail && <span className="field-error">{errors.clientEmail}</span>}</label>
            <label>Dirección <small>Opcional</small><input defaultValue={initialClient?.address} maxLength={500} name="clientAddress" /></label>
            <label>Notas del cliente <small>Solo administración</small><input maxLength={2000} name="clientNotes" /></label>
          </div>
        )}

        <div className="form-grid">
          <label>Pieza o conjunto<input defaultValue={initialPiece} maxLength={300} name="piece" required />{errors.piece && <span className="field-error">{errors.piece}</span>}</label>
          <label>Cantidad<input defaultValue="1" inputMode="numeric" max="100000" min="1" name="quantity" required step="1" type="number" />{errors.quantity && <span className="field-error">{errors.quantity}</span>}</label>
        </div>
        <label>Trabajo a realizar<textarea defaultValue={initialWork} maxLength={2000} name="work" required rows={4} />{errors.work && <span className="field-error">{errors.work}</span>}</label>
      </section>

      <section className="panel-card form-section">
        <div><span className="eyebrow">2 de 2</span><h2>Planificación confirmada por el taller</h2></div>
        <div className="form-grid">
          <label>Fecha de recepción<input defaultValue={receivedDate} name="receivedDate" required type="date" />{errors.receivedDate && <span className="field-error">{errors.receivedDate}</span>}</label>
          <label>Fecha comprometida <small>Opcional; no se copia automáticamente</small><input min={receivedDate} name="dueDate" type="date" />{errors.dueDate && <span className="field-error">{errors.dueDate}</span>}</label>
          <label>Prioridad<select defaultValue="normal" name="priority"><option value="baja">Baja</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></label>
          <label>Estado<select defaultValue="pendiente" name="status"><option value="pendiente">Pendiente</option><option value="en_proceso">En proceso</option><option value="esperando_material">Esperando material</option></select></label>
        </div>
        <label>Observaciones internas <small>No aparecen en documentos del cliente</small><textarea maxLength={2000} name="notes" rows={3} />{errors.notes && <span className="field-error">{errors.notes}</span>}</label>
        {message && <p className="form-message error" role="alert">{message}</p>}
        <div className="form-actions">
          <Link className="button button-secondary" href={cancelHref}>Cancelar</Link>
          <button className="button button-primary" disabled={pending} type="submit">{pending ? "Guardando…" : submitLabel}</button>
        </div>
      </section>
    </form>
  );
}
