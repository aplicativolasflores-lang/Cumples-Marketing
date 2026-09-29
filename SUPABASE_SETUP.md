# Supabase Auth y contenido compartido

Vercel solo aloja la aplicación. El acceso de administrador, la dedicatoria y el audio se gestionan con Supabase.

## Conectar el proyecto

Configura estas variables en el `.env` local y en los ajustes del proyecto de Vercel:

- `VITE_SUPABASE_URL`: URL del proyecto Supabase.
- `VITE_SUPABASE_ANON_KEY`: clave pública `anon` o `publishable` del proyecto.

Estas variables son públicas y están protegidas por las políticas RLS del esquema. No agregues claves `service_role` al frontend.

En Supabase, abre **SQL Editor** y ejecuta [`supabase/schema.sql`](supabase/schema.sql). El script crea `site_content`, configura el bucket público `audio` con límite de 3,5 MB y aplica políticas para que todos lean, pero solo administradores modifiquen contenido y suban audios.

## Crear credenciales de administrador

1. En Supabase, abre **Authentication > Users** y crea un usuario con el correo y contraseña que usará el administrador. No guardes la contraseña en la tabla de contenido; Supabase Auth la administra de forma segura.
2. En **SQL Editor**, asigna el rol administrativo al correo creado, reemplazando `admin@tudominio.com`:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'admin@tudominio.com';
```

3. Cierra sesión y vuelve a ingresar para que Supabase emita un token con el nuevo rol.
4. Vuelve a desplegar la aplicación en Vercel con las dos variables `VITE_SUPABASE_*` configuradas.

El formulario inicia sesión por correo y contraseña con Supabase Auth. La tabla y Storage verifican `app_metadata.role = admin` mediante RLS. No quedan endpoints ni secretos de autenticación de Vercel.

## Audio y publicación

El administrador sube el MP3 al bucket `audio` usando su sesión de Supabase. Al guardar, la aplicación publica la dedicatoria y la URL pública del audio en la fila `greeting` de `site_content`; todos los visitantes cargan esa fila.

En desarrollo, Vite puede usar Supabase directamente con las dos variables públicas del `.env`; no hace falta `vercel dev`.