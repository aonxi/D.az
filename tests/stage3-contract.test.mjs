import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("el endpoint público valida origen, tamaño, esquema e idempotencia", async () => {
  const route = await read("../app/api/solicitudes/route.ts");

  assert.match(route, /isAllowedOrigin\(request\)/);
  assert.match(route, /PUBLIC_REQUEST_MAX_BODY_BYTES/);
  assert.match(route, /validatePublicRequest\(parsed\)/);
  assert.match(route, /idempotency-key/i);
  assert.match(route, /PUBLIC_FORM_RATE_LIMIT_SECRET/);
  assert.match(route, /hmacSha256/);
  assert.doesNotMatch(route, /console\.(log|error)\([^\n]*(nombre|telefono|correo|pieza)/i);
});

test("la creación transaccional es privada, idempotente y limitada", async () => {
  const migration = await read("../supabase/migrations/20260805205000_etapa_3_solicitudes_qr.sql");

  assert.match(migration, /create table private\.solicitud_rate_limits/i);
  assert.match(migration, /pg_advisory_xact_lock/i);
  assert.match(migration, /idempotency_conflict/i);
  assert.match(migration, /rate_limited/i);
  assert.match(migration, /security definer[\s\S]*set search_path = ''/i);
  assert.match(migration, /grant execute[\s\S]*to service_role/i);
  assert.match(migration, /revoke all[\s\S]*from public, anon, authenticated/i);
  assert.doesNotMatch(migration, /grant\s+(select|insert|update|delete)[^;]*\s+to\s+anon/i);
});

test("el navegador recibe solo el folio y conserva la clave para reintentos", async () => {
  const form = await read("../src/features/requests/public-request-form.tsx");
  const route = await read("../app/api/solicitudes/route.ts");

  assert.match(form, /crypto\.randomUUID\(\)/);
  assert.match(form, /"Idempotency-Key"/);
  assert.match(form, /if \(pending\) return/);
  assert.match(form, /El taller debe revisar tu solicitud/);
  assert.match(route, /return json\(\{ folio: result\.folio \}/);
  assert.doesNotMatch(route, /return json\(\{[^}]*\bid\s*:/);
});

test("las lecturas administrativas usan la sesión con RLS y nunca la clave privada", async () => {
  const repository = await read("../src/features/requests/repository.ts");

  assert.match(repository, /requireAdminSession\(\)/);
  assert.match(repository, /createSupabaseServerClient\(\)/);
  assert.doesNotMatch(repository, /createSupabaseServiceClient|SUPABASE_SECRET_KEY/);
});

test("el QR apunta a la URL configurada y está marcado como prueba", async () => {
  const page = await read("../app/mas/qr-solicitud/page.tsx");
  const qr = await read("../src/features/requests/request-qr.tsx");

  assert.match(page, /NEXT_PUBLIC_APP_URL/);
  assert.match(page, /new URL\("\/solicitud"/);
  assert.match(qr, /QRCodeSVG/);
  assert.match(qr, /QR de entorno de prueba/);
  assert.match(qr, /No imprimas este QR en volumen/);
});
