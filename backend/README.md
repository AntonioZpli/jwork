# Jinowork backend

## Autenticación por correo

Configura `DATABASE_URL`, `CLIENT_URL`, las variables SMTP y `EMAIL_FROM` en el entorno del backend. `CLIENT_URL` debe ser el origen del frontend; se utiliza para construir los enlaces de verificación y otras acciones existentes.

Para Gmail, usa `smtp.gmail.com`, el puerto `587` con `SMTP_SECURE=false` o el puerto `465` con `SMTP_SECURE=true`. Configura `SMTP_USER` con tu cuenta de Google y `SMTP_PASS` con una contraseña de aplicación de Google; no uses tu contraseña normal. `EMAIL_FROM` debe usar esa cuenta. No pongas credenciales reales en archivos versionados.

Google requiere la verificación en dos pasos para generar contraseñas de aplicación y puede no ofrecerlas en algunas cuentas administradas o protegidas. Gmail aplica límites diarios y filtros de abuso, por lo que SMTP puede no ser adecuado para envíos transaccionales de gran volumen.
Las cuentas nuevas requieren verificación de correo para iniciar sesión. Las contraseñas se guardan con scrypt y salt aleatorio. Los enlaces de verificación vencen a los 15 minutos; los de recuperación, a los 30. Cambiar la contraseña revoca las sesiones existentes.

## Avisos de seguridad de inicio de sesión

Después de cada inicio exitoso se solicita un aviso por Gmail SMTP al correo verificado. Incluye la hora UTC y el valor del encabezado User-Agent recibido; no se estima una ubicación. El aviso no condiciona el acceso: si SMTP falla, el login continúa y el backend registra el fallo sin guardar un token de acción utilizable.

El enlace «No fui yo» abre `/auth/security-alert` con un token en el fragmento URL. Abrir el enlace no cambia la cuenta. Solo al confirmar en la página, el backend consume el token de un solo uso y revoca todas las sesiones activas. Después se indica al usuario que cambie la contraseña con el flujo existente «¿Olvidaste tu contraseña?».

Esta función añade `LOGIN_SECURITY` al enum `TokenType`. En cada entorno, aplica la migración aditiva con `pnpm exec prisma migrate deploy` y genera el cliente con `pnpm exec prisma generate`. Usa la configuración SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` y `CLIENT_URL`); no requiere clave de API.

El esquema ya contiene `User.passwordHash`, `User.emailVerifiedAt`, `VerificationToken` y `Session`; estos cambios no necesitan migración Prisma. Los correos existentes siguen siendo únicos por igualdad exacta en la base de datos. No se añadió un índice insensible a mayúsculas porque primero hay que revisar posibles duplicados existentes.

Para ejecutar localmente, instala dependencias en `backend`, configura el entorno y usa `pnpm dev`. `pnpm type-check` y `pnpm build` comprueban el backend. No se debe ejecutar `prisma migrate reset`.

## Consola de administración

La consola se publica en `/admin`. Las lecturas y acciones están bajo `/api/admin/*`; cada ruta resuelve la cookie de sesión y vuelve a comprobar en PostgreSQL que el rol actual sea `ADMIN` o `SUPERADMIN`. La interfaz no concede acceso por sí sola. Los campos de contraseña, tokens y sesiones no están en las respuestas del explorador.

Desde el panel SUPERADMIN, al ingresar un correo nuevo se crea una cuenta `ADMIN` activa y verificada con una contraseña aleatoria; el backend guarda su hash y envía las credenciales por Gmail SMTP. La contraseña no se fuerza a cambiar en el primer acceso; el correo recomienda cambiarla cuanto antes desde «¿Olvidaste tu contraseña?».

Este cambio añade `SUPERADMIN` al enum `UserRole` y `JOB_STATUS_CHANGED` a `AuditActionType`. En cada entorno, revisa primero el destino y aplica las migraciones aditivas con `pnpm exec prisma migrate deploy`; luego genera el cliente con `pnpm exec prisma generate`. No se ejecutaron migraciones ni cambios de datos durante la implementación.

La primera cuenta SUPERADMIN se inicializa una sola vez desde el backend después de desplegar el enum. El comando exige el correo de una cuenta `ADMIN` activa ya existente y se detiene si ya existe un SUPERADMIN:

```sh
pnpm run bootstrap:superadmin -- yamirzeledon632@gmail.com
```

El comando actualiza el rol dentro de una transacción serializable y escribe un evento de auditoría. Sustituye el correo por el de la cuenta ADMIN que se verificó para ese entorno; no habilita asignaciones públicas. Desde entonces, solo SUPERADMIN puede asignar o revocar ADMIN. La API protege contra la suspensión del último SUPERADMIN.

La consola usa métricas agregadas desde `User`, `CompanyProfile`, `Job`, `Application`, `Report`, `AuditLog` y snapshots diarios. Si no hay snapshots, el panel de tendencias informa que no hay datos en el periodo. El explorador es de solo lectura y usa modelos y campos allowlisted.
