# TallerFlow — Etapa 2

Base navegable del sistema de gestión para taller con esquema PostgreSQL versionado y autenticación administrativa preparada mediante Supabase. La interfaz continúa utilizando datos ficticios hasta que se conecte deliberadamente un entorno de pruebas.

## Qué permite revisar

- Panel responsive para teléfono, tablet y computador.
- Formulario público y confirmación simulada.
- Listas y detalles de solicitudes y órdenes de trabajo.
- Registro manual simulado.
- Cola recomendada con trabajos sin fecha correctamente identificados.
- Centro, editor y vista previa de cotizaciones.
- Clientes, búsqueda, exportaciones futuras y navegación completa.
- Configuración ficticia del taller en un único archivo.
- Inicio, cierre y recuperación de acceso para un administrador.
- Migración inicial con tablas, relaciones, restricciones, folios y RLS cerrada.
- Pruebas negativas para visitantes y cuentas sin perfil administrativo activo.

Los botones de los módulos que aparentan guardar, emitir, exportar o cambiar estados siguen siendo demostrativos. La persistencia del formulario QR comienza en la Etapa 3.

## Ejecutar localmente

Requisitos: Node.js 22.13 o posterior y pnpm.

```powershell
pnpm install
pnpm dev
```

Abre la dirección local que muestre el proceso de desarrollo. Las rutas iniciales más útiles son:

- `/` — panel administrativo.
- `/solicitud` — formulario público.
- `/login` — acceso administrativo real al conectar Supabase; demostración en el modo predeterminado.
- `/recuperar-acceso` — recuperación administrativa sin enumeración de correos.
- `/trabajos` — cola de órdenes de trabajo.
- `/cotizaciones/COT-2026-0001` — propuesta visual del documento.

## Verificaciones

```powershell
pnpm lint
pnpm typecheck
pnpm test:security
```

Las pruebas reales de migración y RLS requieren Supabase CLI y Docker. Las instrucciones completas están en `docs/operations/supabase-etapa-2.md`.

## Dónde cambiar información

- `src/config/taller.config.ts`: identidad, contacto y valores predeterminados del taller.
- `src/data/mock-data.ts`: personas, solicitudes, OT y cotizaciones ficticias.
- `.env.example`: variables locales previstas. No contiene secretos.
- `supabase/migrations`: esquema PostgreSQL, folios y políticas RLS.
- `supabase/tests/database`: pruebas de acceso ejecutadas dentro de una transacción reversible.

El logo definitivo se colocará posteriormente como `public/branding/logo.png` y su ruta se mantendrá en la configuración.

## Límites deliberados

- No usar datos personales o comerciales reales.
- En modo demostración no se crea una sesión real; los flujos se activan únicamente al conectar Supabase de pruebas.
- El registro público no existe y debe permanecer deshabilitado en Supabase.
- Ningún formulario persiste información.
- No se ha conectado un proyecto Supabase real; la migración está preparada para un entorno de pruebas separado.
- Los cálculos mostrados son ejemplos; su implementación y pruebas exhaustivas corresponden a la Etapa 6.
- La emisión, almacenamiento y versionado real del PDF corresponden a la Etapa 7.

No comenzar la Etapa 3 hasta que la migración, el acceso y las pruebas negativas de la Etapa 2 sean revisados y aprobados.
