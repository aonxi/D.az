begin;

select plan(11);

select has_column('public', 'solicitudes', 'payload_hash', 'Las solicitudes conservan el hash del contenido idempotente');
select has_column('public', 'solicitudes', 'submission_flags', 'Las señales no bloqueantes quedan separadas del contenido del cliente');
select has_table('private', 'solicitud_rate_limits', 'Existe el contador privado de frecuencia');

select ok(
  not has_function_privilege(
    'anon',
    'public.crear_solicitud_publica(text,text,text,text,text,text,text,text,text,text,date,text,text[],integer,integer,integer)',
    'EXECUTE'
  ),
  'El visitante no puede ejecutar directamente la función privilegiada'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.crear_solicitud_publica(text,text,text,text,text,text,text,text,text,text,date,text,text[],integer,integer,integer)',
    'EXECUTE'
  ),
  'Solo el servidor privilegiado puede ejecutar la función pública'
);

set local role anon;
set local "request.jwt.claims" = '{"role":"anon"}';

select throws_ok(
  $$
    select * from public.crear_solicitud_publica(
      '10000000-0000-4000-8000-000000000001', repeat('a', 64), repeat('b', 64),
      'Visitante', '+56911111111', null, null, null, 'Pieza', 'Trabajo', null, null,
      '{}'::text[], 12, 300, 60
    )
  $$,
  'El rol anónimo no puede saltarse el endpoint'
);

reset role;
set local role service_role;
set local "request.jwt.claim.role" = 'service_role';
set local "request.jwt.claims" = '{"role":"service_role"}';

select is(
  (
    select resultado from public.crear_solicitud_publica(
      '10000000-0000-4000-8000-000000000001', repeat('a', 64), repeat('b', 64),
      'Visitante', '+56911111111', null, null, 'persona@ejemplo.cl', 'Eje', 'Rectificar', null, null,
      '{}'::text[], 12, 300, 60
    )
  ),
  'created',
  'El primer envío válido crea la solicitud'
);

select is(
  (
    select resultado from public.crear_solicitud_publica(
      '10000000-0000-4000-8000-000000000001', repeat('a', 64), repeat('b', 64),
      'Visitante', '+56911111111', null, null, 'persona@ejemplo.cl', 'Eje', 'Rectificar', null, null,
      '{}'::text[], 12, 300, 60
    )
  ),
  'replayed',
  'Reintentar el mismo contenido no crea un duplicado'
);

select is(
  (
    select resultado from public.crear_solicitud_publica(
      '10000000-0000-4000-8000-000000000001', repeat('c', 64), repeat('b', 64),
      'Visitante', '+56911111111', null, null, null, 'Otra pieza', 'Otro trabajo', null, null,
      '{}'::text[], 12, 300, 60
    )
  ),
  'idempotency_conflict',
  'La misma clave no acepta un contenido distinto'
);

select is(
  (select count(*)::integer from public.solicitudes where idempotency_key = '10000000-0000-4000-8000-000000000001'),
  1,
  'La clave idempotente conserva exactamente una fila'
);

select is(
  (
    select resultado from public.crear_solicitud_publica(
      '10000000-0000-4000-8000-000000000002', repeat('d', 64), repeat('b', 64),
      'Visitante dos', '+56922222222', null, null, null, 'Polea', 'Fabricar', null, null,
      '{}'::text[], 1, 300, 60
    )
  ),
  'rate_limited',
  'El límite por conexión bloquea solicitudes adicionales en la ventana'
);

select * from finish();
rollback;
