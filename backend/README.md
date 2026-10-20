# Jinowork backend

## Autenticación por correo

Configura `DATABASE_URL`, `CLIENT_URL`, `RESEND_API_KEY` y `EMAIL_FROM` en el entorno del backend. `CLIENT_URL` debe ser el origen público del frontend; se utiliza para construir los enlaces de verificación y recuperación. `EMAIL_FROM` debe ser un remitente permitido por Resend.

En Resend, verifica el dominio que usarás como remitente y publica los registros DNS que Resend indique antes de enviar correos en producción. No pongas claves reales en archivos versionados.

Las cuentas nuevas requieren verificación de correo para iniciar sesión. Las contraseñas se guardan con scrypt y salt aleatorio. Los enlaces de verificación vencen a los 15 minutos; los de recuperación, a los 30. Cambiar la contraseña revoca las sesiones existentes.

El esquema ya contiene `User.passwordHash`, `User.emailVerifiedAt`, `VerificationToken` y `Session`; estos cambios no necesitan migración Prisma. Los correos existentes siguen siendo únicos por igualdad exacta en la base de datos. No se añadió un índice insensible a mayúsculas porque primero hay que revisar posibles duplicados existentes.

Para ejecutar localmente, instala dependencias en `backend`, configura el entorno y usa `pnpm dev`. `pnpm type-check` y `pnpm build` comprueban el backend. No se debe ejecutar `prisma migrate reset`.

## Consola de administración

La consola se publica en `/admin`. Las lecturas y acciones están bajo `/api/admin/*`; cada ruta resuelve la cookie de sesión y vuelve a comprobar en PostgreSQL que el rol actual sea `ADMIN` o `SUPERADMIN`. La interfaz no concede acceso por sí sola. Los campos de contraseña, tokens y sesiones no están en las respuestas del explorador.

Este cambio añade `SUPERADMIN` al enum `UserRole` y `JOB_STATUS_CHANGED` a `AuditActionType`. En cada entorno, revisa primero el destino y aplica las migraciones aditivas con `pnpm exec prisma migrate deploy`; luego genera el cliente con `pnpm exec prisma generate`. No se ejecutaron migraciones ni cambios de datos durante la implementación.

La primera cuenta SUPERADMIN se inicializa una sola vez desde el backend después de desplegar el enum. El comando exige el correo de una cuenta `ADMIN` activa ya existente y se detiene si ya existe un SUPERADMIN:

```sh
pnpm run bootstrap:superadmin -- yamirzeledon632@gmail.com
```

El comando actualiza el rol dentro de una transacción serializable y escribe un evento de auditoría. Sustituye el correo por el de la cuenta ADMIN que se verificó para ese entorno; no habilita asignaciones públicas. Desde entonces, solo SUPERADMIN puede asignar o revocar ADMIN. La API protege contra la suspensión del último SUPERADMIN.

La consola usa métricas agregadas desde `User`, `CompanyProfile`, `Job`, `Application`, `Report`, `AuditLog` y snapshots diarios. Si no hay snapshots, el panel de tendencias informa que no hay datos en el periodo. El explorador es de solo lectura y usa modelos y campos allowlisted.
