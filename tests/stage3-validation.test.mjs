import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidIdempotencyKey,
  PUBLIC_REQUEST_MAX_BODY_BYTES,
  validatePublicRequest,
} from "../src/features/requests/validation.ts";

const validPayload = {
  nombre: "  María   Pérez  ",
  telefono: "+56 9 1234 5678",
  empresa: "",
  rut: "12.345.678-5",
  correo: "MARIA@EJEMPLO.CL",
  pieza: "Eje de portón",
  trabajo: "Rectificar y revisar desgaste.",
  fechaSolicitada: "2026-08-20",
  observaciones: "Llamar antes.",
  consentimiento: true,
  sitioWeb: "",
  startedAt: Date.now() - 5_000,
};

test("normaliza una solicitud pública válida sin mezclar la fecha solicitada", () => {
  const result = validatePublicRequest(validPayload);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.nombre, "María Pérez");
  assert.equal(result.data.correo, "maria@ejemplo.cl");
  assert.equal(result.data.fechaSolicitada, "2026-08-20");
  assert.equal(result.data.completedTooQuickly, false);
});

test("rechaza campos obligatorios, correo, teléfono y fecha inválidos", () => {
  const result = validatePublicRequest({
    ...validPayload,
    nombre: "x",
    telefono: "abc",
    correo: "sin-arroba",
    fechaSolicitada: "2026-02-31",
    consentimiento: false,
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.nombre);
  assert.ok(result.errors.telefono);
  assert.ok(result.errors.correo);
  assert.ok(result.errors.fechaSolicitada);
  assert.ok(result.errors.consentimiento);
});

test("detecta el campo trampa sin devolver detalles del contenido", () => {
  const result = validatePublicRequest({ ...validPayload, sitioWeb: "https://spam.example" });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.honeypotFilled, true);
  assert.equal(result.errors.general, "No fue posible enviar el formulario.");
});

test("acepta únicamente claves UUID v4 y mantiene un cuerpo pequeño", () => {
  assert.equal(isValidIdempotencyKey("10000000-0000-4000-8000-000000000001"), true);
  assert.equal(isValidIdempotencyKey("10000000-0000-1000-8000-000000000001"), false);
  assert.equal(isValidIdempotencyKey("clave-predecible"), false);
  assert.ok(PUBLIC_REQUEST_MAX_BODY_BYTES <= 16_384);
});
