# TallerFlow — Etapa 1

Base local y navegable del sistema de gestión para taller. Esta etapa utiliza exclusivamente datos ficticios y no incluye autenticación real, base de datos, almacenamiento ni generación funcional de PDF.

## Qué permite revisar

- Panel responsive para teléfono, tablet y computador.
- Formulario público y confirmación simulada.
- Listas y detalles de solicitudes y órdenes de trabajo.
- Registro manual simulado.
- Cola recomendada con trabajos sin fecha correctamente identificados.
- Centro, editor y vista previa de cotizaciones.
- Clientes, búsqueda, exportaciones futuras y navegación completa.
- Configuración ficticia del taller en un único archivo.

Los botones que aparentan guardar, emitir, exportar o cambiar estados son demostrativos. La aplicación muestra permanentemente una advertencia para evitar confundirla con un entorno real.

## Ejecutar localmente

Requisitos: Node.js 22.13 o posterior y pnpm.

```powershell
pnpm install
pnpm dev
```

Abre la dirección local que muestre el proceso de desarrollo. Las rutas iniciales más útiles son:

- `/` — panel administrativo.
- `/solicitud` — formulario público.
- `/login` — acceso simulado.
- `/trabajos` — cola de órdenes de trabajo.
- `/cotizaciones/COT-2026-0001` — propuesta visual del documento.

## Verificaciones

```powershell
pnpm lint
pnpm test
```

`pnpm test` compila el proyecto y comprueba que las rutas principales se rendericen con los datos ficticios esperados.

## Dónde cambiar información

- `src/config/taller.config.ts`: identidad, contacto y valores predeterminados del taller.
- `src/data/mock-data.ts`: personas, solicitudes, OT y cotizaciones ficticias.
- `.env.example`: variables locales previstas. No contiene secretos.

El logo definitivo se colocará posteriormente como `public/branding/logo.png` y su ruta se mantendrá en la configuración.

## Límites deliberados

- No usar datos personales o comerciales reales.
- No existe registro, sesión ni recuperación real.
- Ningún formulario persiste información.
- No se han conectado D1, R2, Supabase ni otro proveedor.
- Los cálculos mostrados son ejemplos; su implementación y pruebas exhaustivas corresponden a la Etapa 6.
- La emisión, almacenamiento y versionado real del PDF corresponden a la Etapa 7.

No comenzar la Etapa 2 hasta que esta navegación y estructura sean aprobadas.
