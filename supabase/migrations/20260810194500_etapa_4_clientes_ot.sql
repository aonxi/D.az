begin;

alter table public.ordenes_trabajo
  add column idempotency_key text;

create unique index ot_idempotency_key_unica
  on public.ordenes_trabajo(idempotency_key)
  where idempotency_key is not null;

alter table public.ordenes_trabajo
  add constraint ot_idempotency_key_formato
  check (
    idempotency_key is null
    or idempotency_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  );

create or replace function private.resolver_cliente_ot(
  p_cliente_id uuid,
  p_tipo text,
  p_nombre text,
  p_rut text,
  p_contacto text,
  p_telefono text,
  p_correo text,
  p_direccion text,
  p_notas text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cliente_id uuid;
  v_rut_normalizado text;
begin
  if p_cliente_id is not null then
    select id
      into v_cliente_id
      from public.clientes
     where id = p_cliente_id
       and archived_at is null;

    if v_cliente_id is null then
      raise exception 'El cliente seleccionado no está disponible' using errcode = 'P0002';
    end if;

    return v_cliente_id;
  end if;

  if p_tipo not in ('persona', 'empresa')
     or char_length(btrim(coalesce(p_nombre, ''))) not between 2 and 180
     or char_length(btrim(coalesce(p_telefono, ''))) not between 6 and 30
     or char_length(coalesce(p_rut, '')) > 20
     or char_length(coalesce(p_contacto, '')) > 160
     or char_length(coalesce(p_correo, '')) > 254
     or char_length(coalesce(p_direccion, '')) > 500
     or char_length(coalesce(p_notas, '')) > 2000 then
    raise exception 'Los datos del cliente no son válidos' using errcode = '22023';
  end if;

  if p_correo is not null
     and btrim(p_correo) <> ''
     and p_correo !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'El correo del cliente no es válido' using errcode = '22023';
  end if;

  v_rut_normalizado := nullif(
    regexp_replace(lower(btrim(coalesce(p_rut, ''))), '[^0-9k]', '', 'g'),
    ''
  );

  insert into public.clientes(
    tipo,
    nombre_razon_social,
    rut,
    rut_normalizado,
    persona_contacto,
    telefono,
    correo,
    direccion,
    notas
  )
  values (
    p_tipo,
    btrim(p_nombre),
    nullif(btrim(p_rut), ''),
    v_rut_normalizado,
    nullif(btrim(p_contacto), ''),
    btrim(p_telefono),
    nullif(lower(btrim(p_correo)), ''),
    nullif(btrim(p_direccion), ''),
    nullif(btrim(p_notas), '')
  )
  returning id into v_cliente_id;

  return v_cliente_id;
end;
$$;

create or replace function public.aceptar_solicitud_y_crear_ot(
  p_solicitud_folio text,
  p_idempotency_key text,
  p_cliente_id uuid,
  p_cliente_tipo text,
  p_cliente_nombre text,
  p_cliente_rut text,
  p_cliente_contacto text,
  p_cliente_telefono text,
  p_cliente_correo text,
  p_cliente_direccion text,
  p_cliente_notas text,
  p_pieza text,
  p_trabajo text,
  p_cantidad integer,
  p_fecha_recepcion date,
  p_fecha_comprometida date,
  p_prioridad text,
  p_estado text,
  p_observaciones text
)
returns table (resultado text, ot_folio text, cliente_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_solicitud public.solicitudes%rowtype;
  v_cliente_id uuid;
  v_ot_id uuid;
  v_ot_folio text;
begin
  if not private.es_admin_activo() then
    raise exception 'Acceso denegado' using errcode = '42501';
  end if;

  if p_idempotency_key is null
     or p_idempotency_key !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or char_length(btrim(coalesce(p_pieza, ''))) not between 2 and 300
     or char_length(btrim(coalesce(p_trabajo, ''))) not between 2 and 2000
     or p_cantidad not between 1 and 100000
     or p_fecha_recepcion is null
     or (p_fecha_comprometida is not null and p_fecha_comprometida < p_fecha_recepcion)
     or p_prioridad not in ('baja', 'normal', 'alta', 'urgente')
     or p_estado not in ('pendiente', 'en_proceso', 'esperando_material')
     or char_length(coalesce(p_observaciones, '')) > 2000 then
    raise exception 'Los datos de la OT no son válidos' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('aceptar:' || p_solicitud_folio, 0));

  select *
    into v_solicitud
    from public.solicitudes
   where folio = p_solicitud_folio
   for update;

  if not found then
    raise exception 'La solicitud no existe' using errcode = 'P0002';
  end if;

  select ot.id, ot.folio, ot.cliente_id
    into v_ot_id, v_ot_folio, v_cliente_id
    from public.ordenes_trabajo as ot
   where ot.solicitud_id = v_solicitud.id;

  if v_ot_id is not null then
    return query select 'replayed'::text, v_ot_folio, v_cliente_id;
    return;
  end if;

  if v_solicitud.estado in ('rechazada', 'aceptada') then
    raise exception 'La solicitud ya fue cerrada' using errcode = '23514';
  end if;

  v_cliente_id := private.resolver_cliente_ot(
    p_cliente_id,
    p_cliente_tipo,
    p_cliente_nombre,
    p_cliente_rut,
    p_cliente_contacto,
    p_cliente_telefono,
    p_cliente_correo,
    p_cliente_direccion,
    p_cliente_notas
  );

  insert into public.ordenes_trabajo(
    cliente_id,
    solicitud_id,
    origen,
    pieza,
    trabajo_realizar,
    cantidad,
    fecha_recepcion,
    fecha_comprometida,
    prioridad,
    estado,
    observaciones_internas,
    idempotency_key,
    created_by,
    updated_by
  )
  values (
    v_cliente_id,
    v_solicitud.id,
    'qr',
    btrim(p_pieza),
    btrim(p_trabajo),
    p_cantidad,
    p_fecha_recepcion,
    p_fecha_comprometida,
    p_prioridad,
    p_estado,
    nullif(btrim(p_observaciones), ''),
    p_idempotency_key,
    v_actor,
    v_actor
  )
  returning id, folio into v_ot_id, v_ot_folio;

  update public.solicitudes
     set estado = 'aceptada',
         cliente_id = v_cliente_id,
         reviewed_at = now(),
         reviewed_by = v_actor
   where id = v_solicitud.id;

  insert into public.eventos_criticos(tipo, entidad_tipo, entidad_id, actor_id, detalle)
  values (
    'solicitud_aceptada_ot_creada',
    'orden_trabajo',
    v_ot_id,
    v_actor,
    jsonb_build_object('solicitud_id', v_solicitud.id, 'cliente_id', v_cliente_id)
  );

  return query select 'created'::text, v_ot_folio, v_cliente_id;
end;
$$;

create or replace function public.crear_ot_manual(
  p_idempotency_key text,
  p_cliente_id uuid,
  p_cliente_tipo text,
  p_cliente_nombre text,
  p_cliente_rut text,
  p_cliente_contacto text,
  p_cliente_telefono text,
  p_cliente_correo text,
  p_cliente_direccion text,
  p_cliente_notas text,
  p_pieza text,
  p_trabajo text,
  p_cantidad integer,
  p_fecha_recepcion date,
  p_fecha_comprometida date,
  p_prioridad text,
  p_estado text,
  p_observaciones text
)
returns table (resultado text, ot_folio text, cliente_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_cliente_id uuid;
  v_ot_id uuid;
  v_ot_folio text;
begin
  if not private.es_admin_activo() then
    raise exception 'Acceso denegado' using errcode = '42501';
  end if;

  if p_idempotency_key is null
     or p_idempotency_key !~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or char_length(btrim(coalesce(p_pieza, ''))) not between 2 and 300
     or char_length(btrim(coalesce(p_trabajo, ''))) not between 2 and 2000
     or p_cantidad not between 1 and 100000
     or p_fecha_recepcion is null
     or (p_fecha_comprometida is not null and p_fecha_comprometida < p_fecha_recepcion)
     or p_prioridad not in ('baja', 'normal', 'alta', 'urgente')
     or p_estado not in ('pendiente', 'en_proceso', 'esperando_material')
     or char_length(coalesce(p_observaciones, '')) > 2000 then
    raise exception 'Los datos de la OT no son válidos' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('ot-manual:' || p_idempotency_key, 0));

  select ot.folio, ot.cliente_id
    into v_ot_folio, v_cliente_id
    from public.ordenes_trabajo as ot
   where ot.idempotency_key = p_idempotency_key;

  if v_ot_folio is not null then
    return query select 'replayed'::text, v_ot_folio, v_cliente_id;
    return;
  end if;

  v_cliente_id := private.resolver_cliente_ot(
    p_cliente_id,
    p_cliente_tipo,
    p_cliente_nombre,
    p_cliente_rut,
    p_cliente_contacto,
    p_cliente_telefono,
    p_cliente_correo,
    p_cliente_direccion,
    p_cliente_notas
  );

  insert into public.ordenes_trabajo(
    cliente_id,
    origen,
    pieza,
    trabajo_realizar,
    cantidad,
    fecha_recepcion,
    fecha_comprometida,
    prioridad,
    estado,
    observaciones_internas,
    idempotency_key,
    created_by,
    updated_by
  )
  values (
    v_cliente_id,
    'manual',
    btrim(p_pieza),
    btrim(p_trabajo),
    p_cantidad,
    p_fecha_recepcion,
    p_fecha_comprometida,
    p_prioridad,
    p_estado,
    nullif(btrim(p_observaciones), ''),
    p_idempotency_key,
    v_actor,
    v_actor
  )
  returning id, folio into v_ot_id, v_ot_folio;

  insert into public.eventos_criticos(tipo, entidad_tipo, entidad_id, actor_id, detalle)
  values (
    'ot_manual_creada',
    'orden_trabajo',
    v_ot_id,
    v_actor,
    jsonb_build_object('cliente_id', v_cliente_id)
  );

  return query select 'created'::text, v_ot_folio, v_cliente_id;
end;
$$;

create or replace function public.registrar_decision_solicitud(
  p_solicitud_folio text,
  p_estado text,
  p_nota text
)
returns table (resultado text, estado text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_solicitud_id uuid;
  v_estado_actual text;
begin
  if not private.es_admin_activo() then
    raise exception 'Acceso denegado' using errcode = '42501';
  end if;

  if p_estado not in ('revision', 'requiere_info', 'rechazada')
     or char_length(coalesce(p_nota, '')) > 2000 then
    raise exception 'La decisión no es válida' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('decision:' || p_solicitud_folio, 0));

  select id, solicitudes.estado
    into v_solicitud_id, v_estado_actual
    from public.solicitudes
   where folio = p_solicitud_folio
   for update;

  if v_solicitud_id is null then
    raise exception 'La solicitud no existe' using errcode = 'P0002';
  end if;

  if v_estado_actual in ('aceptada', 'cotizada') then
    raise exception 'La solicitud ya tiene una decisión operativa' using errcode = '23514';
  end if;

  update public.solicitudes
     set estado = p_estado,
         decision_note = nullif(btrim(p_nota), ''),
         reviewed_at = now(),
         reviewed_by = v_actor
   where id = v_solicitud_id;

  insert into public.eventos_criticos(tipo, entidad_tipo, entidad_id, actor_id, detalle)
  values (
    'solicitud_decision_actualizada',
    'solicitud',
    v_solicitud_id,
    v_actor,
    jsonb_build_object('estado_anterior', v_estado_actual, 'estado_nuevo', p_estado)
  );

  return query select 'updated'::text, p_estado;
end;
$$;

revoke all on function private.resolver_cliente_ot(
  uuid, text, text, text, text, text, text, text, text
) from public, anon, authenticated, service_role;

revoke all on function public.aceptar_solicitud_y_crear_ot(
  text, text, uuid, text, text, text, text, text, text, text, text,
  text, text, integer, date, date, text, text, text
) from public, anon, authenticated;

revoke all on function public.crear_ot_manual(
  text, uuid, text, text, text, text, text, text, text, text,
  text, text, integer, date, date, text, text, text
) from public, anon, authenticated;

revoke all on function public.registrar_decision_solicitud(text, text, text)
  from public, anon, authenticated;

grant execute on function public.aceptar_solicitud_y_crear_ot(
  text, text, uuid, text, text, text, text, text, text, text, text,
  text, text, integer, date, date, text, text, text
) to authenticated;

grant execute on function public.crear_ot_manual(
  text, uuid, text, text, text, text, text, text, text, text,
  text, text, integer, date, date, text, text, text
) to authenticated;

grant execute on function public.registrar_decision_solicitud(text, text, text)
  to authenticated;

commit;
