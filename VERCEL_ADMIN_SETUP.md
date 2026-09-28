# Acceso de administrador en Vercel

El candado abre el formulario de acceso. Las credenciales se validan en las funciones de Vercel y la sesión se guarda en una cookie `HttpOnly`, firmada y con vencimiento de 8 horas.

En el proyecto de Vercel, abre **Settings > Environment Variables** y agrega estas variables para los entornos que usarás:

- `ADMIN_USERNAME`: el nombre de usuario que elijas.
- `ADMIN_PASSWORD`: una contraseña fuerte que no uses en otro sitio.
- `ADMIN_SESSION_SECRET`: una clave aleatoria de al menos 32 caracteres.

Puedes generar la clave de sesión en PowerShell con:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Guarda el valor como `ADMIN_SESSION_SECRET` en Vercel, luego vuelve a desplegar el proyecto. No agregues estas credenciales a archivos del repositorio ni las compartas en el chat.

La autenticación del candado depende de las funciones `/api/admin-login` y `/api/admin-session` disponibles en Vercel. El servidor de desarrollo estándar de Vite no ejecuta esas funciones; para probar el acceso localmente se requiere Vercel CLI y `vercel dev` con las variables configuradas.