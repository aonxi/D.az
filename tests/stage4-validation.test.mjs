import assert from "node:assert/strict";
import test from "node:test";
import { validateWorkOrderDraft } from "../src/features/work-orders/validation.ts";

const valid = {
  idempotencyKey: "10000000-0000-4000-8000-000000000001",
  client: {
    mode: "new",
    existingId: null,
    type: "persona",
    name: "María Pérez",
    rut: "12.345.678-5",
    contact: "",
    phone: "+56 9 1234 5678",
    email: "MARIA@EJEMPLO.CL",
    address: "Santiago",
    notes: "",
  },
  piece: "Eje de portón",
  work: "Rectificar y revisar desgaste.",
  quantity: 2,
  receivedDate: "2026-08-10",
  dueDate: "2026-08-15",
  priority: "alta",
  status: "pendiente",
  notes: "Confirmar medidas.",
};

test("valida y normaliza una OT con cliente nuevo", () => {
  const result = validateWorkOrderDraft(valid);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.client.email, "maria@ejemplo.cl");
  assert.equal(result.data.quantity, 2);
  assert.equal(result.data.dueDate, "2026-08-15");
});

test("acepta un cliente existente sin reescribir sus datos", () => {
  const result = validateWorkOrderDraft({
    ...valid,
    client: {
      ...valid.client,
      mode: "existing",
      existingId: "20000000-0000-4000-8000-000000000002",
      name: "",
      phone: "",
    },
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.client.existingId, "20000000-0000-4000-8000-000000000002");
});

test("rechaza cantidades fraccionarias, fechas invertidas y clientes incompletos", () => {
  const result = validateWorkOrderDraft({
    ...valid,
    quantity: 1.5,
    receivedDate: "2026-08-20",
    dueDate: "2026-08-15",
    client: { ...valid.client, name: "x", phone: "12", email: "sin-arroba" },
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.quantity);
  assert.ok(result.errors.dueDate);
  assert.ok(result.errors.clientName);
  assert.ok(result.errors.clientPhone);
  assert.ok(result.errors.clientEmail);
});
