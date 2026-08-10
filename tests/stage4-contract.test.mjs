import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("aceptar una solicitud crea una sola OT de forma transaccional e idempotente", async () => {
  const migration = await read("../supabase/migrations/20260810194500_etapa_4_clientes_ot.sql");

  assert.match(migration, /create or replace function public\.aceptar_solicitud_y_crear_ot/i);
  assert.match(migration, /pg_advisory_xact_lock/i);
  assert.match(migration, /where ot\.solicitud_id = v_solicitud\.id/i);
  assert.match(migration, /return query select 'replayed'/i);
  assert.match(migration, /insert into public\.ordenes_trabajo[\s\S]*update public\.solicitudes/i);
  assert.match(migration, /solicitud_aceptada_ot_creada/i);
  assert.match(migration, /security definer[\s\S]*set search_path = ''/i);
});

test("la OT manual reutiliza cliente o crea uno explícitamente y evita el doble envío", async () => {
  const migration = await read("../supabase/migrations/20260810194500_etapa_4_clientes_ot.sql");

  assert.match(migration, /create or replace function private\.resolver_cliente_ot/i);
  assert.match(migration, /if p_cliente_id is not null/i);
  assert.match(migration, /insert into public\.clientes/i);
  assert.match(migration, /create unique index ot_idempotency_key_unica/i);
  assert.match(migration, /create or replace function public\.crear_ot_manual/i);
  assert.match(migration, /ot_manual_creada/i);
  assert.doesNotMatch(migration, /grant execute[\s\S]*to anon/i);
});

test("los endpoints administrativos exigen sesión y usan RLS sin clave privada", async () => {
  const acceptRoute = await read("../app/api/admin/solicitudes/[folio]/aceptar/route.ts");
  const manualRoute = await read("../app/api/admin/trabajos/route.ts");
  const http = await read("../src/features/admin/http.ts");

  assert.match(http, /getAdminSession\(\)/);
  assert.match(http, /hasSameOrigin\(request\)/);
  assert.match(acceptRoute, /createSupabaseServerClient\(\)/);
  assert.match(manualRoute, /createSupabaseServerClient\(\)/);
  assert.doesNotMatch(`${acceptRoute}\n${manualRoute}`, /createSupabaseServiceClient|SUPABASE_SECRET_KEY/);
});

test("la interfaz diferencia datos originales y datos corregibles de la OT", async () => {
  const detail = await read("../app/solicitudes/[folio]/page.tsx");
  const form = await read("../src/features/work-orders/work-order-form.tsx");

  assert.match(detail, /Información original/);
  assert.match(detail, /Datos operativos corregibles/);
  assert.match(form, /Usar cliente existente/);
  assert.match(form, /Crear cliente nuevo/);
  assert.match(form, /no se copia automáticamente/i);
  assert.match(form, /if \(pending\) return/);
  assert.match(form, /crypto\.randomUUID\(\)/);
});
