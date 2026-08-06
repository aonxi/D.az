begin;

alter table public.solicitudes
  add column payload_hash text,
  add column submission_flags text[] not null default '{}'::text[];

update public.solicitudes
set payload_hash = md5(idempotency_key) || md5(idempotency_key || ':stage3')
where payload_hash is null;

alter table public.solicitudes
  alter column payload_hash set not null,
  add constraint solicitudes_payload_hash_formato
    check (payload_hash ~ '^[0-9a-f]{64}$'),
  add constraint solicitudes_empresa_largo
    check (empresa_ingresada is null or char_length(empresa_ingresada) <= 180),
  add constraint solicitudes_rut_largo
    check (rut_ingresado is null or char_length(rut_ingresado) <= 20),
  add constraint solicitudes_correo_largo
    check (correo_ingresado is null or char_length(correo_ingresado) <= 254),
  add constraint solicitudes_observaciones_largo
    check (observaciones_ingresadas is null or char_length(observaciones_ingresadas) <= 2000),
  add constraint solicitudes_submission_flags_largo
    check (cardinality(submission_flags) <= 5);

create table private.solicitud_rate_limits (
  scope text not null check (scope in ('ip', 'global')),
  scope_hash text not null check (char_length(scope_hash) between 6 and 128),
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (scope, scope_hash, window_started_at)
);

revoke all on private.solicitud_rate_limits from public, anon, authenticated, service_role;

create or replace function public.crear_solicitud_publica(
  p_idempotency_key text,
  p_payload_hash text,
  p_ip_hash text,
  p_nombre text,
  p_telefono text,
  p_empresa text,
  p_rut text,
  p_correo text,
  p_pieza text,
  p_trabajo text,
  p_fecha_solicitada date,
  p_observaciones text,
  p_submission_flags text[],
  p_ip_limit integer,
  p_global_limit integer,
  p_window_minutes integer
)
returns table (resultado text, folio text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing_hash text;
  v_existing_folio text;
  v_request_count integer;
  v_window_started_at timestamptz;
begin
  if p_idempotency_key is null
     or p_idempotency_key !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or p_payload_hash is null
     or p_payload_hash !~ '^[0-9a-f]{64}$'
     or p_ip_hash is null
     or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Metadatos de solicitud inválidos' using errcode = '22023';
  end if;

  if p_ip_limit not between 1 and 100
     or p_global_limit not between 1 and 10000
     or p_window_minutes not between 1 and 1440 then
    raise exception 'Límites de frecuencia inválidos' using errcode = '22023';
  end if;

  if char_length(btrim(coalesce(p_nombre, ''))) not between 2 and 160
     or char_length(btrim(coalesce(p_telefono, ''))) not between 6 and 30
     or char_length(btrim(coalesce(p_pieza, ''))) not between 2 and 300
     or char_length(btrim(coalesce(p_trabajo, ''))) not between 2 and 2000
     or char_length(coalesce(p_empresa, '')) > 180
     or char_length(coalesce(p_rut, '')) > 20
     or char_length(coalesce(p_correo, '')) > 254
     or char_length(coalesce(p_observaciones, '')) > 2000 then
    raise exception 'Campos de solicitud inválidos' using errcode = '22023';
  end if;

  if p_correo is not null and p_correo !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'Correo inválido' using errcode = '22023';
  end if;

  if coalesce(cardinality(p_submission_flags), 0) > 5
     or exists (
       select 1
       from unnest(coalesce(p_submission_flags, '{}'::text[])) as flag
       where flag not in ('completion_under_1500ms')
     ) then
    raise exception 'Señales de solicitud inválidas' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));

  select s.payload_hash, s.folio
  into v_existing_hash, v_existing_folio
  from public.solicitudes as s
  where s.idempotency_key = p_idempotency_key;

  if found then
    if v_existing_hash = p_payload_hash then
      return query select 'replayed'::text, v_existing_folio;
    else
      return query select 'idempotency_conflict'::text, null::text;
    end if;
    return;
  end if;

  v_window_started_at := to_timestamp(
    floor(extract(epoch from now()) / (p_window_minutes * 60)) * (p_window_minutes * 60)
  );

  insert into private.solicitud_rate_limits(
    scope,
    scope_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values ('ip', p_ip_hash, v_window_started_at, 1, now())
  on conflict (scope, scope_hash, window_started_at)
  do update
    set request_count = private.solicitud_rate_limits.request_count + 1,
        updated_at = now()
  returning request_count into v_request_count;

  if v_request_count > p_ip_limit then
    return query select 'rate_limited'::text, null::text;
    return;
  end if;

  insert into private.solicitud_rate_limits(
    scope,
    scope_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values ('global', 'global', v_window_started_at, 1, now())
  on conflict (scope, scope_hash, window_started_at)
  do update
    set request_count = private.solicitud_rate_limits.request_count + 1,
        updated_at = now()
  returning request_count into v_request_count;

  if v_request_count > p_global_limit then
    return query select 'rate_limited'::text, null::text;
    return;
  end if;

  insert into public.solicitudes(
    nombre_ingresado,
    telefono_ingresado,
    empresa_ingresada,
    rut_ingresado,
    correo_ingresado,
    pieza_ingresada,
    trabajo_ingresado,
    fecha_solicitada,
    observaciones_ingresadas,
    idempotency_key,
    payload_hash,
    submission_flags,
    privacy_consent_at
  )
  values (
    btrim(p_nombre),
    btrim(p_telefono),
    nullif(btrim(p_empresa), ''),
    nullif(btrim(p_rut), ''),
    nullif(lower(btrim(p_correo)), ''),
    btrim(p_pieza),
    btrim(p_trabajo),
    p_fecha_solicitada,
    nullif(btrim(p_observaciones), ''),
    p_idempotency_key,
    p_payload_hash,
    coalesce(p_submission_flags, '{}'::text[]),
    now()
  )
  returning solicitudes.folio into v_existing_folio;

  return query select 'created'::text, v_existing_folio;
end;
$$;

revoke all on function public.crear_solicitud_publica(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  text,
  text[],
  integer,
  integer,
  integer
) from public, anon, authenticated;

grant execute on function public.crear_solicitud_publica(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  text,
  text[],
  integer,
  integer,
  integer
) to service_role;

commit;
