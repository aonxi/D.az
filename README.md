# TallerFlow — Etapa 3

Sistema navegable para taller con esquema PostgreSQL, autenticación administrativa y recepción segura de solicitudes mediante QR. El modo predeterminado continúa usando datos ficticios; la persistencia solo se activa al conectar deliberadamente un proyecto Supabase de pruebas.

## Qué permite revisar

- Panel responsive para teléfono, tablet y computador.
- Formulario público validado en navegador y servidor.
- Creación idempotente de solicitudes con folio y confirmación sin IDs internos.
- Campo trampa, límite de cuerpo y frecuencia configurable sin guardar la IP original.
- Lista, filtros y detalle administrativo de solicitudes mediante sesión y RLS.
- QR de prueba descargable como SVG desde `/mas/qr-solicitud`.
- Listas y detalles simulados de órdenes de trabajo.
- Registro manual simulado.
- Cola recomendada con trabajos sin fecha correctamente identificados.
- Centro, editor y vista previa de cotizaciones.
- Clientes, búsqueda, exportaciones futuras y navegación completa.
- Configuración ficticia del taller en un único archivo.
- Inicio, cierre y recuperación de acceso para un administrador.
- Migración inicial con tablas, relaciones, restricciones, folios y RLS cerrada.
- Pruebas negativas para visitantes y cuentas sin perfil administrativo activo.

Los botones de OT, clientes, cotizaciones, exportaciones y decisiones sobre solicitudes siguen siendo demostrativos. Aceptar, cotizar primero, pedir información y rechazar se implementarán transaccionalmente en la Etapa 4.

## Ejecutar localmente

Requisitos: Node.js 22.13 o posterior y pnpm.

```powershell
pnpm install
pnpm dev
```

Abre la dirección local que muestre el proceso de desarrollo. Las rutas iniciales más útiles son:

- `/` — panel administrativo.
- `/solicitud` — formulario público.
- `/solicitudes` — bandeja administrativa real al conectar Supabase; ficticia en modo demo.
- `/mas/qr-solicitud` — QR del entorno configurado.
- `/login` — acceso administrativo real al conectar Supabase; demostración en el modo predeterminado.
- `/recuperar-acceso` — recuperación administrativa sin enumeración de correos.
- `/trabajos` — cola de órdenes de trabajo.
- `/cotizaciones/COT-2026-0001` — propuesta visual del documento.

## Verificaciones

```powershell
pnpm lint
pnpm typecheck
pnpm test:security
pnpm test:stage3
```

Las pruebas reales de migración, RLS e idempotencia requieren Supabase CLI y Docker. La conexión y prueba manual están documentadas en `docs/operations/etapa-3-solicitudes-qr.md`.

## Dónde cambiar información

- `src/config/taller.config.ts`: identidad, contacto y valores predeterminados del taller.
- `src/data/mock-data.ts`: personas, solicitudes, OT y cotizaciones ficticias.
- `.env.example`: variables locales previstas. No contiene secretos.
- `supabase/migrations`: esquema PostgreSQL, folios y políticas RLS.
- `supabase/tests/database`: pruebas de acceso ejecutadas dentro de una transacción reversible.
- `src/features/requests`: validación, formulario, QR y consultas administrativas.

El logo definitivo se colocará posteriormente como `public/branding/logo.png` y su ruta se mantendrá en la configuración.

## Límites deliberados

- No usar datos personales o comerciales reales.
- En modo demostración no se crea una sesión real; los flujos se activan únicamente al conectar Supabase de pruebas.
- El registro público no existe y debe permanecer deshabilitado en Supabase.
- El formulario no simula guardados: sin configuración privada devuelve indisponibilidad temporal.
- No se ha conectado un proyecto Supabase real; las migraciones están preparadas para un entorno de pruebas separado.
- La dirección IP se usa únicamente para crear un hash HMAC de frecuencia y no se conserva en texto.
- Los cálculos mostrados son ejemplos; su implementación y pruebas exhaustivas corresponden a la Etapa 6.
- La emisión, almacenamiento y versionado real del PDF corresponden a la Etapa 7.

No comenzar la Etapa 4 hasta que el formulario, el folio, la privacidad pública, la idempotencia y el QR de la Etapa 3 sean probados y aprobados.
