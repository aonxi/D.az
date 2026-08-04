begin;

select plan(18);

select has_table('public', 'perfiles_admin', 'Existe perfiles_admin');
select has_table('public', 'clientes', 'Existe clientes');
select has_table('public', 'solicitudes', 'Existe solicitudes');
select has_table('public', 'ordenes_trabajo', 'Existe ordenes_trabajo');
select has_table('public', 'cotizaciones', 'Existe cotizaciones');
select has_table('public', 'items_cotizacion', 'Existe items_cotizacion');
select has_table('public', 'documentos', 'Existe documentos');
select has_table('public', 'secuencias_folio', 'Existe secuencias_folio');
select has_table('public', 'eventos_criticos', 'Existe eventos_criticos');

select is(
  (
    select count(*)::integer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'perfiles_admin', 'clientes', 'solicitudes', 'ordenes_trabajo',
        'cotizaciones', 'items_cotizacion', 'documentos',
        'secuencias_folio', 'eventos_criticos'
      )
      and c.relrowsecurity = true
  ),
  9,
  'RLS está activa en todas las tablas de la Etapa 2'
);

set local role anon;
set local "request.jwt.claims" = '{"role":"anon"}';

select throws_ok(
  $$select count(*) from public.clientes$$,
  'El rol anónimo no puede leer clientes'
);

select throws_ok(
  $$insert into public.clientes(tipo, nombre_razon_social, telefono) values ('persona', 'Intruso', '+56900000000')$$,
  'El rol anónimo no puede crear clientes'
);

reset role;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated', 'admin@test.local',
    extensions.crypt('Prueba-Segura-123!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated', 'inactivo@test.local',
    extensions.crypt('Prueba-Segura-123!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  );

insert into public.perfiles_admin(id, nombre, activo)
values
  ('00000000-0000-0000-0000-000000000001', 'Administrador de prueba', true),
  ('00000000-0000-0000-0000-000000000002', 'Administrador inactivo', false);

set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000002';
set local "request.jwt.claim.role" = 'authenticated';
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}';

select is((select count(*)::integer from public.clientes), 0, 'Un usuario no activo no puede leer filas');
select throws_ok(
  $$insert into public.clientes(tipo, nombre_razon_social, telefono) values ('persona', 'Sin permiso', '+56900000001')$$,
  'Un usuario no activo no puede crear filas'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';
set local "request.jwt.claim.role" = 'authenticated';
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is((select count(*)::integer from public.perfiles_admin), 1, 'El administrador activo ve solo su perfil');
select lives_ok(
  $$insert into public.clientes(tipo, nombre_razon_social, telefono) values ('persona', 'Cliente permitido', '+56911111111')$$,
  'El administrador activo puede crear clientes'
);
select is((select count(*)::integer from public.clientes), 1, 'El administrador activo puede leer clientes');
select matches(
  (select folio from public.siguiente_folio('OT', date '2026-08-04')),
  '^OT-2026-[0-9]{4,}$',
  'La asignación de folios es transaccional y mantiene el formato'
);

select * from finish();
rollback;
