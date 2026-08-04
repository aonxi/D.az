import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("la migración contiene el esquema mínimo de la V0", async () => {
  const migration = await read("../supabase/migrations/20260804193000_etapa_2_esquema_auth.sql");
  const tables = [
    "perfiles_admin",
    "clientes",
    "solicitudes",
    "ordenes_trabajo",
    "cotizaciones",
    "items_cotizacion",
    "documentos",
    "secuencias_folio",
    "eventos_criticos",
  ];

  for (const table of tables) {
    assert.match(migration, new RegExp(`create table public\\.${table}\\s*\\(`, "i"));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }

  assert.match(migration, /cantidad integer not null[^;]*check \(cantidad > 0\)/i);
  assert.match(migration, /tasa_iva_bp integer not null default 1900/i);
  assert.match(migration, /create or replace function public\.siguiente_folio/i);
  assert.match(migration, /on conflict \(tipo, year\)[\s\S]*last_number \+ 1/i);
});

test("RLS queda cerrada para visitantes y limitada al administrador activo", async () => {
  const migration = await read("../supabase/migrations/20260804193000_etapa_2_esquema_auth.sql");
  const policies = migration.match(/create policy[\s\S]*?;/gi) ?? [];

  assert.match(migration, /revoke all on all tables in schema public from anon, authenticated/i);
  assert.doesNotMatch(migration, /grant\s+(select|insert|update|delete)[^;]*\s+to\s+anon/i);
  assert.ok(policies.length >= 8);
  assert.ok(policies.every((policy) => !/\bto\s+anon\b/i.test(policy)));
  assert.match(migration, /private\.es_admin_activo\(\)/i);
  assert.match(migration, /id = \(select auth\.uid\(\)\) and activo = true/i);
});

test("el registro público está deshabilitado y no hay secretos en variables públicas", async () => {
  const config = await read("../supabase/config.toml");
  const envExample = await read("../.env.example");
  const trackedText = `${config}\n${envExample}`;

  assert.match(config, /enable_signup = false/g);
  assert.match(config, /enable_anonymous_sign_ins = false/);
  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_URL=/);
  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=/);
  assert.doesNotMatch(trackedText, /SUPABASE_SERVICE_ROLE_KEY\s*=/i);
  assert.doesNotMatch(trackedText, /sb_secret_/i);
});

test("la protección de páginas valida el token y el perfil administrativo", async () => {
  const server = await read("../src/lib/supabase/server.ts");
  const login = await read("../src/features/auth/login-form.tsx");

  assert.match(server, /auth\.getClaims\(\)/);
  assert.doesNotMatch(server, /auth\.getSession\(\)/);
  assert.match(server, /from\("perfiles_admin"\)/);
  assert.match(server, /eq\("activo", true\)/);
  assert.match(login, /signInWithPassword/);
  assert.match(login, /auth\.signOut\(\)/);
});

test("la recuperación usa una respuesta que no enumera correos", async () => {
  const recovery = await read("../src/features/auth/recovery-form.tsx");

  assert.match(recovery, /resetPasswordForEmail/);
  assert.match(recovery, /Si el correo está habilitado, recibirás instrucciones/);
  assert.doesNotMatch(recovery, /usuario no existe|correo no existe|cuenta no existe/i);
});
