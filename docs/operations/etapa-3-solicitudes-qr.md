# Operación de la Etapa 3 — solicitudes mediante QR

Esta etapa permite recibir solicitudes en un proyecto **Supabase de pruebas**. No autoriza datos reales ni producción.

## Qué se guarda

Por cada envío válido se guardan los datos originales del formulario, el folio, la fecha solicitada, el instante del consentimiento, una clave idempotente, un hash del contenido y señales técnicas no bloqueantes. La dirección IP no se guarda: el servidor la transforma mediante HMAC antes de aplicar el límite de frecuencia.

El visitante solo recibe el folio `SOL-AAAA-NNNN`. No puede leer, buscar, modificar ni eliminar solicitudes. El administrador autenticado y activo puede ver la lista y el detalle mediante RLS. Las acciones de conversión permanecen deshabilitadas hasta la Etapa 4.

## Variables

Copiar `.env.example` como `.env.local` y completar únicamente con un proyecto Supabase separado para staging:

- `NEXT_PUBLIC_APP_MODE=supabase`
- `NEXT_PUBLIC_APP_URL`: URL HTTPS del staging o `http://localhost:3000` en local.
- `NEXT_PUBLIC_SUPABASE_URL`: URL publicable del proyecto.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: clave publicable.
- `SUPABASE_SECRET_KEY`: Secret key exclusiva del servidor.
- `PUBLIC_FORM_RATE_LIMIT_SECRET`: cadena aleatoria larga, distinta de las claves de Supabase.
- `PUBLIC_FORM_IP_LIMIT`, `PUBLIC_FORM_GLOBAL_LIMIT` y `PUBLIC_FORM_RATE_WINDOW_MINUTES`: límites configurables.

Nunca colocar `SUPABASE_SECRET_KEY` ni `PUBLIC_FORM_RATE_LIMIT_SECRET` en una variable `NEXT_PUBLIC_`, captura, commit o mensaje.

## Aplicar desde cero

Con Supabase CLI y Docker disponibles:

```powershell
supabase start
supabase db reset
supabase test db
```

Para un proyecto remoto de staging ya vinculado:

```powershell
supabase link --project-ref TU_PROJECT_REF
supabase db push --dry-run
supabase db push
supabase test db --linked
```

Revisar el `--dry-run` antes de aplicar. No vincular producción en esta etapa.

## Crear el administrador de pruebas

1. Crear el usuario desde Supabase Dashboard, no mediante registro público.
2. Copiar su UUID.
3. Ejecutar en el editor SQL del proyecto de pruebas:

```sql
insert into public.perfiles_admin (id, nombre, activo)
values ('UUID_DEL_USUARIO', 'Propietario de prueba', true);
```

## Prueba manual obligatoria

Usar únicamente nombres, teléfonos, correos, piezas y trabajos ficticios.

1. Iniciar la aplicación y abrir `/solicitud` sin iniciar sesión.
2. Intentar enviar vacío y confirmar errores asociados a cada campo.
3. Completar datos ficticios, pulsar dos veces rápidamente y confirmar un solo folio.
4. Simular una reconexión y reintentar sin cambiar campos; debe volver el mismo folio.
5. Guardar una captura del mensaje, sin compartir información real.
6. Iniciar sesión como administrador y abrir `/solicitudes`.
7. Filtrar por estado y período; abrir el folio recién creado.
8. Confirmar que la fecha pedida aparece como solicitada, nunca como comprometida.
9. Abrir `/mas/qr-solicitud`, escanear desde iPhone, Android si está disponible y otro navegador.
10. Intentar leer solicitudes como visitante mediante la API de datos; debe fallar.

## Errores y recuperación

- `503`: falta una variable privada o Supabase no está disponible. Corregir configuración; el formulario no simula un guardado.
- `409`: el contenido cambió durante un reintento. Recargar y enviar nuevamente.
- `429`: se alcanzó un límite. Esperar la ventana indicada; no aumentar límites sin revisar abuso.
- `500` con código de referencia: revisar logs por ese código. Los logs no contienen el cuerpo ni datos personales completos.
- Si una migración falla en staging, no editar tablas manualmente. Corregir el archivo, recrear el entorno y ejecutar desde cero.

El QR definitivo requiere dominio estable, HTTPS, pruebas negativas completas y aprobación del piloto.
