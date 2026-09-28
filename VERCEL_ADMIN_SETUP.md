# Acceso de administrador en Vercel

El candado abre el formulario de acceso. Las credenciales se validan en las funciones de Vercel y la sesión se guarda en una cookie `HttpOnly`, firmada y con vencimiento de 8 horas.

En el proyecto de Vercel, abre **Settings > Environment Variables** y agrega estas variables para los entornos que usarás:

- `ADMIN_USERNAME`: 
- `ADMIN_PASSWORD`: 
- `ADMIN_SESSION_SECRET`: 
- `BLOB_READ_WRITE_TOKEN`: token creado al conectar un Blob Store de Vercel

Puedes generar la clave de sesión en PowerShell con:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Guarda el valor como `ADMIN_SESSION_SECRET` en Vercel, luego vuelve a desplegar el proyecto. No agregues estas credenciales a archivos del repositorio ni las compartas en el chat.

La autenticación del candado depende de las funciones `/api/admin-login` y `/api/admin-session` disponibles en Vercel. El servidor de desarrollo estándar de Vite no ejecuta esas funciones; para probar el acceso localmente se requiere Vercel CLI y `vercel dev` con las variables configuradas.

## Audio con Vercel Blob

En el proyecto de Vercel, abre **Storage > Create Database > Blob**, crea un Blob Store y conéctalo al proyecto. Vercel agregará automáticamente `BLOB_READ_WRITE_TOKEN` a las variables de entorno. Activa la variable para Production, Preview y Development según los entornos que uses, y vuelve a desplegar.

Desde el panel administrador, **Subir MP3** enviará el archivo a Blob y colocará su URL pública en el campo de audio. El límite actual es de 3,5 MB y solo se aceptan archivos de audio. Para probarlo localmente con `vercel dev`, también necesitas la variable `BLOB_READ_WRITE_TOKEN` en tu entorno local.