begin;

create schema if not exists private;
revoke all on schema private from public;

create table public.perfiles_admin (
  id uuid primary key references auth.users(id) on delete restrict,
  nombre text not null check (char_length(btrim(nombre)) between 2 and 120),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('persona', 'empresa')),
  nombre_razon_social text not null check (char_length(btrim(nombre_razon_social)) between 2 and 180),
  rut text,
  rut_normalizado text,
  persona_contacto text,
  telefono text not null check (char_length(btrim(telefono)) between 6 and 30),
  correo text,
  direccion text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint clientes_rut_normalizado_unico unique (rut_normalizado)
);

create table public.secuencias_folio (
  tipo text not null check (tipo in ('SOL', 'OT', 'COT')),
  year integer not null check (year between 2000 and 9999),
  last_number integer not null default 0 check (last_number >= 0),
  primary key (tipo, year)
);

create table public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  folio_year integer not null check (folio_year between 2000 and 9999),
  folio_number integer not null check (folio_number > 0),
  folio text generated always as ('SOL-' || folio_year::text || '-' || lpad(folio_number::text, 4, '0')) stored,
  estado text not null default 'nueva' check (estado in ('nueva', 'revision', 'requiere_info', 'aceptada', 'cotizada', 'rechazada')),
  nombre_ingresado text not null check (char_length(btrim(nombre_ingresado)) between 2 and 160),
  telefono_ingresado text not null check (char_length(btrim(telefono_ingresado)) between 6 and 30),
  empresa_ingresada text,
  rut_ingresado text,
  correo_ingresado text,
  pieza_ingresada text not null check (char_length(btrim(pieza_ingresada)) between 2 and 300),
  trabajo_ingresado text not null check (char_length(btrim(trabajo_ingresado)) between 2 and 2000),
  fecha_solicitada date,
  observaciones_ingresadas text,
  cliente_id uuid references public.clientes(id) on delete restrict,
  decision_note text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.perfiles_admin(id) on delete restrict,
  idempotency_key text not null unique check (char_length(idempotency_key) between 16 and 200),
  privacy_consent_at timestamptz not null,
  unique (folio_year, folio_number)
);

create table public.ordenes_trabajo (
  id uuid primary key default gen_random_uuid(),
  folio_year integer not null check (folio_year between 2000 and 9999),
  folio_number integer not null check (folio_number > 0),
  folio text generated always as ('OT-' || folio_year::text || '-' || lpad(folio_number::text, 4, '0')) stored,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  solicitud_id uuid unique references public.solicitudes(id) on delete restrict,
  cotizacion_origen_id uuid,
  origen text not null check (origen in ('qr', 'manual', 'cotizacion')),
  pieza text not null check (char_length(btrim(pieza)) between 2 and 300),
  trabajo_realizar text not null check (char_length(btrim(trabajo_realizar)) between 2 and 2000),
  cantidad integer not null default 1 check (cantidad > 0),
  fecha_recepcion date not null,
  fecha_comprometida date,
  prioridad text not null default 'normal' check (prioridad in ('baja', 'normal', 'alta', 'urgente')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_proceso', 'esperando_material', 'listo', 'entregado', 'cancelado')),
  manual_queue_position integer check (manual_queue_position is null or manual_queue_position >= 0),
  observaciones_internas text,
  created_by uuid not null references public.perfiles_admin(id) on delete restrict,
  updated_by uuid not null references public.perfiles_admin(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (folio_year, folio_number),
  constraint ot_fechas_validas check (fecha_comprometida is null or fecha_comprometida >= fecha_recepcion),
  constraint ot_cierre_consistente check (
    (estado in ('entregado', 'cancelado') and closed_at is not null)
    or (estado not in ('entregado', 'cancelado') and closed_at is null)
  )
);

create table public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  grupo_version_id uuid not null default gen_random_uuid(),
  version integer not null default 1 check (version > 0),
  reemplaza_id uuid references public.cotizaciones(id) on delete restrict,
  folio_year integer check (folio_year is null or folio_year between 2000 and 9999),
  folio_number integer check (folio_number is null or folio_number > 0),
  folio text generated always as (
    case
      when folio_year is null or folio_number is null then null
      else 'COT-' || folio_year::text || '-' || lpad(folio_number::text, 4, '0')
    end
  ) stored,
  estado text not null default 'borrador' check (estado in ('borrador', 'emitida', 'aprobada', 'rechazada', 'vencida', 'reemplazada')),
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  solicitud_id uuid references public.solicitudes(id) on delete restrict,
  ot_id uuid references public.ordenes_trabajo(id) on delete restrict,
  fecha_emision date,
  fecha_vencimiento date,
  tasa_iva_bp integer not null default 1900 check (tasa_iva_bp between 0 and 10000),
  subtotal_clp bigint not null default 0 check (subtotal_clp >= 0),
  descuento_clp bigint not null default 0 check (descuento_clp between 0 and subtotal_clp),
  neto_clp bigint not null default 0 check (neto_clp >= 0),
  iva_clp bigint not null default 0 check (iva_clp >= 0),
  total_clp bigint not null default 0 check (total_clp >= 0),
  anticipo_requerido_clp bigint not null default 0 check (anticipo_requerido_clp between 0 and total_clp),
  condiciones_pago text,
  materiales_condicion text,
  fecha_entrega_estimada text,
  observaciones text,
  cliente_snapshot jsonb,
  taller_snapshot jsonb,
  created_by uuid not null references public.perfiles_admin(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  issued_at timestamptz,
  unique (grupo_version_id, version),
  constraint cotizacion_folio_completo check ((folio_year is null) = (folio_number is null)),
  constraint cotizacion_vigencia_valida check (fecha_vencimiento is null or fecha_emision is null or fecha_vencimiento >= fecha_emision),
  constraint cotizacion_emision_consistente check (
    (estado = 'borrador' and issued_at is null and folio_year is null)
    or (estado <> 'borrador' and issued_at is not null and folio_year is not null)
  )
);

alter table public.ordenes_trabajo
  add constraint ot_cotizacion_origen_fk
  foreign key (cotizacion_origen_id) references public.cotizaciones(id) on delete restrict;

create unique index ot_cotizacion_origen_unica
  on public.ordenes_trabajo(cotizacion_origen_id)
  where cotizacion_origen_id is not null;

create unique index cotizacion_folio_version_unica
  on public.cotizaciones(folio_year, folio_number, version)
  where folio_year is not null;

create table public.items_cotizacion (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references public.cotizaciones(id) on delete cascade,
  position integer not null check (position > 0),
  pieza text,
  descripcion text not null check (char_length(btrim(descripcion)) between 2 and 2000),
  cantidad integer not null check (cantidad > 0),
  precio_unitario_clp bigint not null check (precio_unitario_clp >= 0),
  subtotal_clp bigint not null check (subtotal_clp >= 0),
  unique (cotizacion_id, position)
);

create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('cotizacion_pdf', 'ot_pdf')),
  cotizacion_id uuid references public.cotizaciones(id) on delete restrict,
  ot_id uuid references public.ordenes_trabajo(id) on delete restrict,
  storage_path text not null unique check (char_length(storage_path) between 10 and 500),
  mime_type text not null check (mime_type = 'application/pdf'),
  size_bytes bigint not null check (size_bytes > 0),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  renderer_version text not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.perfiles_admin(id) on delete restrict,
  constraint documento_propietario_valido check (
    (tipo = 'cotizacion_pdf' and cotizacion_id is not null and ot_id is null)
    or (tipo = 'ot_pdf' and ot_id is not null and cotizacion_id is null)
  )
);

create unique index documento_cotizacion_unico
  on public.documentos(cotizacion_id)
  where tipo = 'cotizacion_pdf';

create table public.eventos_criticos (
  id bigint generated always as identity primary key,
  tipo text not null,
  entidad_tipo text,
  entidad_id uuid,
  actor_id uuid references public.perfiles_admin(id) on delete restrict,
  detalle jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint eventos_sin_secretos check (not (detalle ?| array['password', 'password_hash', 'token', 'access_token', 'refresh_token', 'service_role']))
);

create or replace function private.es_admin_activo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfiles_admin
    where id = (select auth.uid())
      and activo = true
  );
$$;

create or replace function public.siguiente_folio(
  p_tipo text,
  p_fecha date default (timezone('America/Santiago', now()))::date
)
returns table (folio_year integer, folio_number integer, folio text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year integer := extract(year from p_fecha)::integer;
  v_number integer;
begin
  if p_tipo not in ('SOL', 'OT', 'COT') then
    raise exception 'Tipo de folio inválido' using errcode = '22023';
  end if;

  if not private.es_admin_activo()
     and coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Acceso denegado' using errcode = '42501';
  end if;

  insert into public.secuencias_folio(tipo, year, last_number)
  values (p_tipo, v_year, 1)
  on conflict (tipo, year)
  do update set last_number = public.secuencias_folio.last_number + 1
  returning last_number into v_number;

  return query
    select v_year, v_number, p_tipo || '-' || v_year::text || '-' || lpad(v_number::text, 4, '0');
end;
$$;

create or replace function private.asignar_folio_solicitud()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  nuevo record;
begin
  if new.folio_year is null or new.folio_number is null then
    select * into nuevo from public.siguiente_folio('SOL');
    new.folio_year := nuevo.folio_year;
    new.folio_number := nuevo.folio_number;
  end if;
  return new;
end;
$$;

create or replace function private.asignar_folio_ot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  nuevo record;
begin
  if new.folio_year is null or new.folio_number is null then
    select * into nuevo from public.siguiente_folio('OT');
    new.folio_year := nuevo.folio_year;
    new.folio_number := nuevo.folio_number;
  end if;
  return new;
end;
$$;

create or replace function private.bloquear_cambio_folio()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.folio_year is distinct from new.folio_year
     or old.folio_number is distinct from new.folio_number then
    raise exception 'Un folio asignado no puede modificarse' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.validar_folio_grupo_cotizacion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.folio_year is not null and exists (
    select 1
    from public.cotizaciones existente
    where existente.grupo_version_id = new.grupo_version_id
      and existente.id <> new.id
      and existente.folio_year is not null
      and (existente.folio_year, existente.folio_number)
          is distinct from (new.folio_year, new.folio_number)
  ) then
    raise exception 'Las versiones de una cotización deben compartir el folio base' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' and old.folio_year is not null
     and (old.folio_year, old.folio_number)
         is distinct from (new.folio_year, new.folio_number) then
    raise exception 'Un folio emitido no puede modificarse' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.marcar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger solicitudes_asignar_folio
before insert on public.solicitudes
for each row execute function private.asignar_folio_solicitud();

create trigger solicitudes_bloquear_folio
before update on public.solicitudes
for each row execute function private.bloquear_cambio_folio();

create trigger ot_asignar_folio
before insert on public.ordenes_trabajo
for each row execute function private.asignar_folio_ot();

create trigger ot_bloquear_folio
before update on public.ordenes_trabajo
for each row execute function private.bloquear_cambio_folio();

create trigger cotizaciones_validar_folio_grupo
before insert or update on public.cotizaciones
for each row execute function private.validar_folio_grupo_cotizacion();

create trigger clientes_updated_at
before update on public.clientes
for each row execute function private.marcar_updated_at();

create trigger ot_updated_at
before update on public.ordenes_trabajo
for each row execute function private.marcar_updated_at();

create trigger cotizaciones_updated_at
before update on public.cotizaciones
for each row execute function private.marcar_updated_at();

alter table public.perfiles_admin enable row level security;
alter table public.clientes enable row level security;
alter table public.solicitudes enable row level security;
alter table public.ordenes_trabajo enable row level security;
alter table public.cotizaciones enable row level security;
alter table public.items_cotizacion enable row level security;
alter table public.documentos enable row level security;
alter table public.secuencias_folio enable row level security;
alter table public.eventos_criticos enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.es_admin_activo() to anon, authenticated;
grant execute on function public.siguiente_folio(text, date) to authenticated, service_role;

grant select on public.perfiles_admin to authenticated;
grant select, insert, update, delete on public.clientes to authenticated;
grant select, insert, update, delete on public.solicitudes to authenticated;
grant select, insert, update, delete on public.ordenes_trabajo to authenticated;
grant select, insert, update, delete on public.cotizaciones to authenticated;
grant select, insert, update, delete on public.items_cotizacion to authenticated;
grant select, insert, update, delete on public.documentos to authenticated;
grant select, insert on public.eventos_criticos to authenticated;

create policy admin_lee_su_perfil
on public.perfiles_admin
for select
to authenticated
using (id = (select auth.uid()) and activo = true);

create policy admin_gestiona_clientes
on public.clientes
for all
to authenticated
using ((select private.es_admin_activo()))
with check ((select private.es_admin_activo()));

create policy admin_gestiona_solicitudes
on public.solicitudes
for all
to authenticated
using ((select private.es_admin_activo()))
with check ((select private.es_admin_activo()));

create policy admin_gestiona_ot
on public.ordenes_trabajo
for all
to authenticated
using ((select private.es_admin_activo()))
with check ((select private.es_admin_activo()));

create policy admin_gestiona_cotizaciones
on public.cotizaciones
for all
to authenticated
using ((select private.es_admin_activo()))
with check ((select private.es_admin_activo()));

create policy admin_gestiona_items_cotizacion
on public.items_cotizacion
for all
to authenticated
using ((select private.es_admin_activo()))
with check ((select private.es_admin_activo()));

create policy admin_gestiona_documentos
on public.documentos
for all
to authenticated
using ((select private.es_admin_activo()))
with check ((select private.es_admin_activo()));

create policy admin_lee_eventos_criticos
on public.eventos_criticos
for select
to authenticated
using ((select private.es_admin_activo()));

create policy admin_crea_eventos_criticos
on public.eventos_criticos
for insert
to authenticated
with check ((select private.es_admin_activo()) and actor_id = (select auth.uid()));

create index clientes_nombre_idx on public.clientes using gin (to_tsvector('simple', nombre_razon_social));
create index clientes_telefono_idx on public.clientes(telefono);
create index solicitudes_estado_submitted_idx on public.solicitudes(estado, submitted_at desc);
create index solicitudes_cliente_idx on public.solicitudes(cliente_id);
create index ot_cola_idx on public.ordenes_trabajo(estado, fecha_comprometida, prioridad, created_at);
create index ot_cliente_idx on public.ordenes_trabajo(cliente_id);
create index cotizaciones_cliente_idx on public.cotizaciones(cliente_id, created_at desc);
create index cotizaciones_solicitud_idx on public.cotizaciones(solicitud_id);
create index cotizaciones_ot_idx on public.cotizaciones(ot_id);
create index eventos_created_idx on public.eventos_criticos(created_at desc);

commit;
