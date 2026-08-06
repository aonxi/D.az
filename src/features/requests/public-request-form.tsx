"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  publicRequestLimits,
  type PublicRequestErrors,
  validatePublicRequest,
} from "@/src/features/requests/validation";

type ApiResponse = {
  folio?: string;
  message?: string;
  errors?: PublicRequestErrors;
  reference?: string;
};

function FormError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <small className="field-error" id={id}>{message}</small>;
}

function PublicRequestConfirmation({ folio, onReset }: { folio: string; onReset: () => void }) {
  return (
    <section className="public-card confirmation-card" aria-labelledby="confirmation-title">
      <span className="confirmation-mark" aria-hidden="true">✓</span>
      <span className="eyebrow">Envío completado</span>
      <h1 id="confirmation-title">Solicitud recibida</h1>
      <p className="folio-display">{folio}</p>
      <p>El taller debe revisar tu solicitud. Este envío todavía no confirma precio, recepción de la pieza ni fecha de entrega.</p>
      <div className="notice-box">
        <strong>Guarda este folio</strong>
        <span>Te recomendamos tomar una captura para mencionarlo cuando contactes al taller.</span>
      </div>
      <button className="button button-primary" onClick={onReset} type="button">Realizar otra solicitud</button>
    </section>
  );
}

export function PublicRequestForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const startedAtRef = useRef(0);
  const idempotencyKeyRef = useRef<string | null>(null);
  const attemptedPayloadRef = useRef<string | null>(null);
  const [errors, setErrors] = useState<PublicRequestErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [folio, setFolio] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  function resetAttemptAfterEdit() {
    if (!attemptedPayloadRef.current || pending) return;
    attemptedPayloadRef.current = null;
    idempotencyKeyRef.current = null;
  }

  function resetForm() {
    formRef.current?.reset();
    startedAtRef.current = Date.now();
    idempotencyKeyRef.current = null;
    attemptedPayloadRef.current = null;
    setErrors({});
    setMessage(null);
    setReference(null);
    setFolio(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const formData = new FormData(event.currentTarget);
    const payload = {
      nombre: formData.get("nombre"),
      telefono: formData.get("telefono"),
      empresa: formData.get("empresa"),
      rut: formData.get("rut"),
      correo: formData.get("correo"),
      pieza: formData.get("pieza"),
      trabajo: formData.get("trabajo"),
      fechaSolicitada: formData.get("fechaSolicitada"),
      observaciones: formData.get("observaciones"),
      consentimiento: formData.get("consentimiento") === "on",
      sitioWeb: formData.get("sitioWeb"),
      startedAt: startedAtRef.current,
    };
    const validation = validatePublicRequest(payload);

    if (!validation.ok) {
      setErrors(validation.errors);
      setMessage("Revisa los campos indicados antes de enviar.");
      setReference(null);
      return;
    }

    const serializedPayload = JSON.stringify(payload);
    if (
      attemptedPayloadRef.current &&
      attemptedPayloadRef.current !== serializedPayload
    ) {
      idempotencyKeyRef.current = null;
    }

    idempotencyKeyRef.current ??= crypto.randomUUID();
    attemptedPayloadRef.current = serializedPayload;
    setPending(true);
    setErrors({});
    setMessage(null);
    setReference(null);

    try {
      const response = await fetch("/api/solicitudes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKeyRef.current,
        },
        body: serializedPayload,
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.folio) {
        if (response.status === 409) {
          idempotencyKeyRef.current = null;
          attemptedPayloadRef.current = null;
        }
        setErrors(result.errors ?? {});
        setMessage(result.message ?? "No fue posible enviar la solicitud.");
        setReference(result.reference ?? null);
        return;
      }

      setFolio(result.folio);
    } catch {
      setMessage("No pudimos comunicarnos con el taller. Revisa tu conexión y vuelve a intentarlo.");
    } finally {
      setPending(false);
    }
  }

  if (folio) {
    return <PublicRequestConfirmation folio={folio} onReset={resetForm} />;
  }

  return (
    <section className="public-card">
      <span className="eyebrow">Formulario público</span>
      <h1>Cuéntanos qué trabajo necesitas</h1>
      <p>El taller revisará la información antes de confirmar precio, recepción de la pieza o fecha de entrega.</p>
      <form
        className="form-stack"
        noValidate
        onChange={resetAttemptAfterEdit}
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <fieldset className="form-fields" disabled={pending}>
          <label>
            Nombre <span aria-hidden="true">*</span>
            <input
              aria-describedby={errors.nombre ? "nombre-error" : undefined}
              aria-invalid={Boolean(errors.nombre)}
              autoComplete="name"
              maxLength={publicRequestLimits.nombre}
              name="nombre"
              placeholder="Nombre y apellido"
              required
            />
            <FormError id="nombre-error" message={errors.nombre} />
          </label>
          <label>
            Teléfono <span aria-hidden="true">*</span>
            <input
              aria-describedby={errors.telefono ? "telefono-error" : undefined}
              aria-invalid={Boolean(errors.telefono)}
              autoComplete="tel"
              inputMode="tel"
              maxLength={publicRequestLimits.telefono}
              name="telefono"
              placeholder="+56 9 1234 5678"
              required
            />
            <FormError id="telefono-error" message={errors.telefono} />
          </label>
          <label>
            Pieza o conjunto <span aria-hidden="true">*</span>
            <input
              aria-describedby={errors.pieza ? "pieza-error" : undefined}
              aria-invalid={Boolean(errors.pieza)}
              maxLength={publicRequestLimits.pieza}
              name="pieza"
              placeholder="Ej. eje de portón"
              required
            />
            <FormError id="pieza-error" message={errors.pieza} />
          </label>
          <label>
            Trabajo solicitado <span aria-hidden="true">*</span>
            <textarea
              aria-describedby={errors.trabajo ? "trabajo-error" : undefined}
              aria-invalid={Boolean(errors.trabajo)}
              maxLength={publicRequestLimits.trabajo}
              name="trabajo"
              placeholder="Describe lo que necesitas realizar"
              required
              rows={4}
            />
            <FormError id="trabajo-error" message={errors.trabajo} />
          </label>
          <div className="form-grid">
            <label>
              Empresa <small>Opcional</small>
              <input aria-describedby={errors.empresa ? "empresa-error" : undefined} aria-invalid={Boolean(errors.empresa)} autoComplete="organization" maxLength={publicRequestLimits.empresa} name="empresa" />
              <FormError id="empresa-error" message={errors.empresa} />
            </label>
            <label>
              RUT <small>Opcional</small>
              <input aria-describedby={errors.rut ? "rut-error" : undefined} aria-invalid={Boolean(errors.rut)} maxLength={publicRequestLimits.rut} name="rut" placeholder="12.345.678-5" />
              <FormError id="rut-error" message={errors.rut} />
            </label>
            <label>
              Correo <small>Opcional</small>
              <input aria-describedby={errors.correo ? "correo-error" : undefined} aria-invalid={Boolean(errors.correo)} autoComplete="email" maxLength={publicRequestLimits.correo} name="correo" type="email" />
              <FormError id="correo-error" message={errors.correo} />
            </label>
            <label>
              Fecha en que lo necesita <small>Opcional y no comprometida</small>
              <input aria-describedby={errors.fechaSolicitada ? "fecha-error" : undefined} aria-invalid={Boolean(errors.fechaSolicitada)} name="fechaSolicitada" type="date" />
              <FormError id="fecha-error" message={errors.fechaSolicitada} />
            </label>
          </div>
          <label>
            Observaciones <small>Opcional</small>
            <textarea aria-describedby={errors.observaciones ? "observaciones-error" : undefined} aria-invalid={Boolean(errors.observaciones)} maxLength={publicRequestLimits.observaciones} name="observaciones" rows={3} />
            <FormError id="observaciones-error" message={errors.observaciones} />
          </label>
          <label aria-hidden="true" className="honeypot-field">
            Sitio web
            <input autoComplete="off" name="sitioWeb" tabIndex={-1} />
          </label>
          <label className="check-row">
            <input aria-describedby={errors.consentimiento ? "consentimiento-error" : undefined} aria-invalid={Boolean(errors.consentimiento)} name="consentimiento" type="checkbox" />
            <span>Autorizo al taller a usar estos datos para revisar mi solicitud y contactarme sobre ella.</span>
          </label>
          <FormError id="consentimiento-error" message={errors.consentimiento} />
        </fieldset>

        {message && (
          <p className="form-message error" role="alert">
            {message}{reference ? ` Código de referencia: ${reference}` : ""}
          </p>
        )}
        <button className="button button-primary button-block" disabled={pending} type="submit">
          {pending ? "Enviando…" : "Enviar solicitud"}
        </button>
        <p className="form-footnote">Tus datos se usarán únicamente para revisar y responder esta solicitud. Enviar no confirma precio ni fecha.</p>
      </form>
    </section>
  );
}
