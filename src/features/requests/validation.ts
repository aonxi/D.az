export const PUBLIC_REQUEST_MAX_BODY_BYTES = 16_384;

export const publicRequestLimits = {
  nombre: 160,
  telefono: 30,
  empresa: 180,
  rut: 20,
  correo: 254,
  pieza: 300,
  trabajo: 2_000,
  observaciones: 2_000,
} as const;

export type PublicRequestField =
  | "nombre"
  | "telefono"
  | "empresa"
  | "rut"
  | "correo"
  | "pieza"
  | "trabajo"
  | "fechaSolicitada"
  | "observaciones"
  | "consentimiento"
  | "general";

export type PublicRequestErrors = Partial<Record<PublicRequestField, string>>;

export type ValidPublicRequest = {
  nombre: string;
  telefono: string;
  empresa: string | null;
  rut: string | null;
  correo: string | null;
  pieza: string;
  trabajo: string;
  fechaSolicitada: string | null;
  observaciones: string | null;
  completedTooQuickly: boolean;
};

type ValidationResult =
  | { ok: true; data: ValidPublicRequest }
  | { ok: false; errors: PublicRequestErrors; honeypotFilled: boolean };

function cleanSingleLine(value: unknown) {
  if (typeof value !== "string") return "";
  return value.normalize("NFC").replace(/\0/g, "").replace(/\s+/g, " ").trim();
}

function cleanMultiline(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFC")
    .replace(/\0/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t ]+\n/g, "\n")
    .trim();
}

function optional(value: string) {
  return value.length > 0 ? value : null;
}

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validatePublicRequest(input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: { general: "El formulario no tiene un formato válido." }, honeypotFilled: false };
  }

  const raw = input as Record<string, unknown>;
  const nombre = cleanSingleLine(raw.nombre);
  const telefono = cleanSingleLine(raw.telefono);
  const empresa = cleanSingleLine(raw.empresa);
  const rut = cleanSingleLine(raw.rut).toUpperCase();
  const correo = cleanSingleLine(raw.correo).toLowerCase();
  const pieza = cleanSingleLine(raw.pieza);
  const trabajo = cleanMultiline(raw.trabajo);
  const fechaSolicitada = cleanSingleLine(raw.fechaSolicitada);
  const observaciones = cleanMultiline(raw.observaciones);
  const honeypotFilled = cleanSingleLine(raw.sitioWeb).length > 0;
  const errors: PublicRequestErrors = {};

  if (nombre.length < 2 || nombre.length > publicRequestLimits.nombre) {
    errors.nombre = "Ingresa un nombre de entre 2 y 160 caracteres.";
  }

  const phoneDigits = telefono.replace(/\D/g, "");
  if (
    telefono.length < 6 ||
    telefono.length > publicRequestLimits.telefono ||
    phoneDigits.length < 6 ||
    !/^[+()0-9 .-]+$/.test(telefono)
  ) {
    errors.telefono = "Ingresa un teléfono válido; por ejemplo, +56 9 1234 5678.";
  }

  if (empresa.length > publicRequestLimits.empresa) {
    errors.empresa = "La empresa no puede superar 180 caracteres.";
  }

  if (rut.length > publicRequestLimits.rut) {
    errors.rut = "El RUT no puede superar 20 caracteres.";
  }

  if (
    correo.length > publicRequestLimits.correo ||
    (correo.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
  ) {
    errors.correo = "Ingresa un correo válido o deja el campo vacío.";
  }

  if (pieza.length < 2 || pieza.length > publicRequestLimits.pieza) {
    errors.pieza = "Describe la pieza con entre 2 y 300 caracteres.";
  }

  if (trabajo.length < 2 || trabajo.length > publicRequestLimits.trabajo) {
    errors.trabajo = "Describe el trabajo con entre 2 y 2.000 caracteres.";
  }

  if (fechaSolicitada && !isValidDateOnly(fechaSolicitada)) {
    errors.fechaSolicitada = "Selecciona una fecha válida.";
  }

  if (observaciones.length > publicRequestLimits.observaciones) {
    errors.observaciones = "Las observaciones no pueden superar 2.000 caracteres.";
  }

  if (raw.consentimiento !== true) {
    errors.consentimiento = "Debes autorizar el uso de los datos para enviar la solicitud.";
  }

  if (honeypotFilled) {
    errors.general = "No fue posible enviar el formulario.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, honeypotFilled };
  }

  const startedAt = typeof raw.startedAt === "number" ? raw.startedAt : 0;

  return {
    ok: true,
    data: {
      nombre,
      telefono,
      empresa: optional(empresa),
      rut: optional(rut),
      correo: optional(correo),
      pieza,
      trabajo,
      fechaSolicitada: optional(fechaSolicitada),
      observaciones: optional(observaciones),
      completedTooQuickly: startedAt > 0 && Date.now() - startedAt < 1_500,
    },
  };
}

export function isValidIdempotencyKey(value: string | null) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  );
}
