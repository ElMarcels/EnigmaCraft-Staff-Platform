# EnigmaCraft Staff Platform

Plataforma interna y privada para el staff de la **network de Minecraft hispana EnigmaCraft**.
Solo pueden acceder los usuarios que los fundadores crean dentro de la propia plataforma.

## Stack

- **Next.js 16** (App Router, Server Components + Server Functions)
- **Tailwind CSS 4**
- **Prisma 7** (ORM) + **SQLite** (base de datos local, sin servidor externo)
- **better-sqlite3** (driver adapter de Prisma 7)
- Autenticación por contraseña (bcrypt) y sesión firmada por cookie (HMAC)

## Funcionalidades

- **Login exclusivo**: solo entran cuentas creadas por los fundadores.
- **Mensajería global**: categorías de canales + canales de texto/voz entre todo el staff.
- **Sistema de archivos tipo Drive**: carpetas y archivos con subida, descarga, renombrado y borrado.
- **Copias de seguridad automáticas**: copia de los archivos y de la base de datos cada 24 h en producción (carpeta `backups/`), más copias manuales.
- **Panel de Fundadores (exclusivo, rango FOUNDER)**:
  - Creación y gestión de usuarios (rango, activar/desactivar, restablecer contraseña, eliminar).
  - Copias de seguridad.
  - Registro de actividad (auditoría).
- **Anuncios oficiales** a todo el staff.
- **Notificaciones** internas.
- **Cambio de contraseña** propio.

## Rangos

| Rango      | Descripción |
|------------|-------------|
| FOUNDER    | Acceso total + panel de fundadores. |
| ADMIN      | Gestiona canales, anuncios y archivos. |
| MOD        | Gestiona canales y contenido. |
| BUILDER    | Mensajería y archivos de construcción. |
| STAFF      | Miembro base del equipo. |

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear el archivo `.env` a partir de la plantilla:

   ```bash
   cp .env.example .env
   ```

   Rellena las credenciales del **fundador inicial**:

   ```
   FOUNDER_USERNAME="tu_usuario"
   FOUNDER_PASSWORD="tu_contraseña_segura"
   FOUNDER_DISPLAY_NAME="TuNombre"
   SESSION_SECRET="<genera uno con: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\">"
   ```

3. Aplicar la base de datos y sembrar el fundador:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. Arrancar en desarrollo:

   ```bash
   npm run dev
   ```

   y entra en `http://localhost:3000` con las credenciales del fundador.

## Producción

```bash
npm run build
npm start
```

> 🔒 **Seguridad**: `.env` está en `.gitignore` y nunca debe subirse al repositorio.
> Cambia la `SESSION_SECRET` y las contraseñas de los usuarios cuando sea necesario.
> Las copias de seguridad automáticas solo se generan en producción (`NODE_ENV=production`).

## Estructura

- `src/app/(app)/` — páginas autenticadas (dashboard, chat, files, announcements, founder, settings, notifications).
- `src/app/login/` — inicio de sesión.
- `src/actions/` — Server Functions (auth, messaging, files, founder).
- `src/components/` — componentes de UI.
- `src/lib/` — db, auth, storage, backups, roles, auditoría.
- `prisma/` — esquema, migraciones y seed.
