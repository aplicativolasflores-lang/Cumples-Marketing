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

Al ejecutar `pnpm dev`, el acceso local acepta `123` como usuario y contraseña. Este acceso solo existe en desarrollo y no autentica en producción. El sitio desplegado usa las funciones `/api/admin-login` y `/api/admin-session` de Vercel con las variables configuradas arriba. Para probar ese flujo real en local, utiliza Vercel CLI con `vercel dev` y configura las variables correspondientes.

## Audio con Vercel Blob

En el proyecto de Vercel, abre **Storage > Create Database > Blob**, crea un Blob Store y conéctalo al proyecto. Vercel agregará automáticamente `BLOB_READ_WRITE_TOKEN` a las variables de entorno. Activa la variable para Production, Preview y Development según los entornos que uses, y vuelve a desplegar.

Desde el panel administrador, **Subir MP3** enviará el archivo a Blob y colocará su URL pública en el campo de audio. El límite actual es de 3,5 MB y solo se aceptan archivos de audio. Al pulsar **Guardar cambios**, el sitio publicará la dedicatoria y la URL del audio en `site-settings/greeting.json`, un objeto público de Blob que pueden consultar todos los visitantes. La función solo permite escribirlo con una sesión válida de administrador.

Conecta el Blob Store al proyecto y asegúrate de que `BLOB_READ_WRITE_TOKEN` está configurado para Production. La función de subida existente también requiere ese token para firmar cargas desde el navegador. La publicación de la configuración usa la integración OIDC o el token del Blob Store disponible en las funciones de Vercel. Después de cambiar las variables, vuelve a desplegar.

En `pnpm dev`, la configuración y el audio solo se guardan en el navegador local; Vite no ejecuta las funciones `/api`. Para probar la publicación compartida en local, usa `vercel dev` con las variables del proyecto cargadas.