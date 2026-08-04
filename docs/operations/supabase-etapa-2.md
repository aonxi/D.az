# Etapa 2: Supabase, migraciones y administrador

Esta etapa prepara una base PostgreSQL protegida y el acceso de un único administrador. No conecta datos reales ni habilita todavía el envío del formulario QR.

## Qué incluye

- Tablas mínimas de clientes, solicitudes, órdenes de trabajo, cotizaciones, ítems, documentos, secuencias y eventos críticos.
- Folios independientes `SOL`, `OT` y `COT`, asignados de forma transaccional por año.
- Cantidades enteras y montos CLP enteros, según las decisiones aprobadas.
- Registro público deshabilitado.
- Políticas RLS cerradas para visitantes y usuarios que no tengan un perfil administrativo activo.
- Inicio, cierre y recuperación de sesión con mensajes que no revelan si un correo existe.

## Preparar un entorno de pruebas

1. Crear un proyecto nuevo en Supabase destinado únicamente a pruebas. No reutilizarlo posteriormente como producción.
2. En **Authentication → Providers → Email**, desactivar la creación pública de usuarios y mantener habilitado el acceso por correo y contraseña.
3. En **Authentication → URL Configuration**, registrar la URL local y la URL de pruebas, incluyendo `/auth/callback` como redirección permitida.
4. Aplicar las migraciones de `supabase/migrations` mediante Supabase CLI o el flujo de migraciones del proyecto.
5. Crear manualmente el usuario propietario desde **Authentication → Users**. No añadir una pantalla de registro a la aplicación.
6. Copiar el UUID del usuario y ejecutar desde el editor SQL:

```sql
insert into public.perfiles_admin (id, nombre, activo)
values ('UUID-DEL-USUARIO', 'Propietario del taller', true);
```

7. Copiar `.env.example` como `.env.local`, establecer `NEXT_PUBLIC_APP_MODE=supabase` y completar únicamente la URL y la clave publicable del proyecto.
8. Reiniciar la aplicación y comprobar que las rutas administrativas redirigen a `/login` sin sesión.

Nunca se debe copiar una clave `service_role` al navegador, al repositorio ni a un archivo compartido.

## Verificación local de base de datos

Con Docker y Supabase CLI instalados:

```powershell
supabase start
supabase db reset
supabase test db
```

Las pruebas crean usuarios y registros ficticios dentro de transacciones que se revierten al finalizar. Deben comprobar al menos que `anon` no puede leer o escribir, un usuario inactivo no accede y el administrador activo sí puede trabajar.

## Volver al modo demostración

Establecer `NEXT_PUBLIC_APP_MODE=demo` y reiniciar. En ese modo la interfaz sigue mostrando los datos ficticios de la Etapa 1 y no escribe en Supabase.
