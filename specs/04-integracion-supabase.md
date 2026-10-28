# SPEC 04 — Integración base con Supabase

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-10-27
> **Objetivo:** Conectar la aplicación Next.js con el proyecto Supabase existente mediante clientes tipados de servidor y navegador, sin crear tablas ni cambiar ninguna funcionalidad.

## Por qué existe esta spec

Arcade Vault va a usar Supabase para base de datos, Auth, Realtime y Edge Functions. Cada una de esas piezas irá en su propia spec. Esta spec deja solo la base técnica: dependencias, variables de entorno, clientes, la CLI enlazada al proyecto remoto, los tipos generados y una ruta que prueba la conexión. Al terminar, la app se comporta exactamente igual que antes para el usuario.

## Alcance

**Entra:**

- Instalar `@supabase/supabase-js` y `@supabase/ssr` como dependencias, y la CLI `supabase` como dependencia de desarrollo.
- Variables de entorno públicas `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local` (con valores) y en `.env.example` (sin valores).
- `lib/supabase/client.ts`: crea el cliente de navegador con `createBrowserClient` de `@supabase/ssr`.
- `lib/supabase/server.ts`: crea el cliente de servidor con `createServerClient` de `@supabase/ssr`, leyendo y escribiendo cookies con `cookies()` de `next/headers`.
- `lib/supabase/env.ts`: lee y valida las dos variables y lanza un error claro si falta alguna.
- Inicializar la CLI (`supabase init`): crea `supabase/config.toml` versionado en git.
- Enlazar la CLI al proyecto remoto `ekufipvjqsspwekwbdji` (`supabase link`), usando `SUPABASE_DB_PASSWORD` de `.env.local`.
- Generar `lib/supabase/database.types.ts` a partir del esquema remoto y tipar los dos clientes con `Database`.
- Script `npm run db:types` que regenera los tipos.
- Route Handler `GET /api/health/supabase` (`app/api/health/supabase/route.ts`) que comprueba que el proyecto responde y devuelve `{ ok }` sin exponer claves.

**Fuera de alcance (para specs futuras):**

- Crear tablas, migraciones, políticas RLS o triggers.
- Supabase Auth: registro, inicio de sesión, confirmación de correo, perfiles y sustitución de la sesión mock de `lib/session.ts`.
- `proxy.ts` para refrescar la sesión de Auth en cada petición (llega con la spec de Auth).
- Guardar puntuaciones en Supabase o leaderboards reales.
- Realtime.
- Edge Functions.
- Stack local de Supabase con Docker (`supabase start`).
- Clave secreta (`service_role` / secret key) y cualquier cliente con privilegios de administrador.
- Cambios visibles en la interfaz.
- Tests automatizados.

## Modelo de datos

Esta spec no crea tablas. El esquema `public` del proyecto está vacío, así que `database.types.ts` solo contiene el tipo `Database` vacío que genera Supabase. Las specs siguientes lo regeneran al crear tablas.

Variables de entorno:

```
# Públicas: las usan los clientes de servidor y navegador
NEXT_PUBLIC_SUPABASE_URL=https://ekufipvjqsspwekwbdji.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Solo para la CLI (supabase link / db). Nunca se lee desde la app.
SUPABASE_DB_PASSWORD=
```

Contrato de `GET /api/health/supabase`:

```ts
// 200 { ok: true }
// 503 { ok: false; error: string } // mensaje genérico; el detalle va solo al log del servidor
```

Archivos nuevos:

```
lib/supabase/env.ts
lib/supabase/client.ts
lib/supabase/server.ts
lib/supabase/database.types.ts
app/api/health/supabase/route.ts
supabase/config.toml
```

## Plan de implementación

1. Instalar dependencias: `npm install @supabase/supabase-js @supabase/ssr` y `npm install -D supabase`. Verificar que `npm run build` sigue pasando.
2. Variables de entorno: obtener la URL y la publishable key del proyecto (MCP `get_project_url` / `get_publishable_keys`), añadirlas a `.env.local` y añadir los nombres sin valores a `.env.example`. `SUPABASE_DB_PASSWORD` ya existe en `.env.local`.
3. Crear `lib/supabase/env.ts` con una función que devuelva `{ url, publishableKey }` y lance un `Error` con el nombre de la variable que falta.
4. Inicializar la CLI con `npx supabase init` y enlazarla con `npx supabase link --project-ref ekufipvjqsspwekwbdji`. Versionar `supabase/config.toml` y comprobar que `supabase/.temp/` y los archivos con secretos quedan fuera de git.
5. Añadir el script `"db:types": "supabase gen types typescript --linked --schema public > lib/supabase/database.types.ts"` a `package.json` y ejecutarlo. Comprobar que el archivo contiene el tipo `Database`.
6. Crear `lib/supabase/client.ts` con `createClient()`, que devuelve `createBrowserClient<Database>(url, publishableKey)`.
7. Crear `lib/supabase/server.ts` con `async createClient()`, que hace `await cookies()` y devuelve `createServerClient<Database>` con `getAll` / `setAll`. `setAll` va en `try/catch`, porque escribir cookies desde un Server Component falla y es esperable.
8. Crear `app/api/health/supabase/route.ts` con `GET`, que usa el cliente de servidor y una llamada que pasa por la red (`fetch` a `${url}/auth/v1/health` con la cabecera `apikey`, o la llamada equivalente del cliente). Responde `200 { ok: true }`, o `503` con un mensaje genérico y el detalle en `console.error`. Probar con `curl http://localhost:3000/api/health/supabase`.
9. Actualizar `CLAUDE.md` en la sección "Stack y configuración" con una línea sobre `lib/supabase/` y `npm run db:types`.
10. Ejecutar `npm run lint` y `npm run build`, y corregir errores.

Antes de escribir código específico de Next (`cookies()`, Route Handlers, el comportamiento de Cache Components con APIs dinámicas), leer la guía relevante en `node_modules/next/dist/docs/`. Para los clientes, seguir la guía oficial de `@supabase/ssr` para Next.js App Router (consultar con el MCP `search_docs`).

## Criterios de aceptación

- [ ] `npm run build` termina sin errores.
- [ ] `npm run lint` termina sin errores.
- [ ] `package.json` lista `@supabase/supabase-js` y `@supabase/ssr` en `dependencies` y `supabase` en `devDependencies`.
- [ ] `.env.example` contiene `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_DB_PASSWORD` sin valores.
- [ ] `.env.local` sigue ignorado por git y ninguna clave aparece en el repositorio (`git grep` de la publishable key y de la contraseña sin coincidencias).
- [ ] `supabase/config.toml` existe y está versionado.
- [ ] `npm run db:types` regenera `lib/supabase/database.types.ts` sin errores.
- [ ] `lib/supabase/client.ts` y `lib/supabase/server.ts` exportan `createClient` tipado con `Database`.
- [ ] Con las variables correctas, `GET /api/health/supabase` responde `200` con `{ "ok": true }`.
- [ ] Con una URL o una clave inválida, `GET /api/health/supabase` responde `503` con un mensaje genérico, sin la clave ni la traza.
- [ ] Si falta una variable, el error del servidor nombra la variable que falta.
- [ ] No existe `proxy.ts` ni `middleware.ts`.
- [ ] El esquema `public` del proyecto sigue sin tablas (`list_tables` vacío).
- [ ] Todas las pantallas existentes (`/`, `/biblioteca`, `/juegos/<id>`, `/salon`, `/auth`, `/acerca-de`) funcionan igual que antes.

## Decisiones

- **Sí:** solo la integración base. Decisión del usuario: DB, Auth, Realtime y Edge Functions van cada uno en su propia spec.
- **Sí:** `@supabase/ssr` con cliente de servidor y de navegador. Es el paquete oficial para el App Router y la base que necesitan Auth y Realtime.
- **No:** `@supabase/auth-helpers-nextjs`. Está deprecado y lo sustituye `@supabase/ssr`.
- **Sí:** Supabase CLI con `supabase/` en el repo. Decisión del usuario; deja preparadas las migraciones y la carpeta `supabase/functions` para las Edge Functions futuras.
- **Sí:** CLI como `devDependency` (`npx supabase`). Fija la versión por proyecto y no requiere una instalación global.
- **No:** stack local con Docker. Hoy se trabaja contra el proyecto remoto; el stack local puede llegar con la primera migración.
- **Sí:** tipos generados en `lib/supabase/database.types.ts`. Decisión del usuario; los clientes quedan tipados desde el primer día.
- **Sí:** publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Es el formato actual de clave pública de Supabase y puede ir en el cliente.
- **No:** clave `anon` legacy. La sustituye la publishable key.
- **No:** secret key / `service_role`. Nada en esta spec necesita saltarse RLS.
- **Sí:** ruta `GET /api/health/supabase`. Decisión del usuario; demuestra la conexión real sin crear tablas.
- **No:** tabla de prueba. El usuario no quiere crear tablas en esta spec.
- **No:** `proxy.ts` para refrescar sesión. Sin Auth no hay sesión que refrescar, y añadiría trabajo a cada petición sin beneficio; llega con la spec de Auth.
- **Sí:** `lib/supabase/env.ts` con validación explícita. Un error que nombra la variable que falta ahorra depuración.

## Riesgos

| Riesgo                                                                       | Mitigación                                                                                                        |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `cookies()` es una API dinámica y con Cache Components puede romper el build | El cliente de servidor solo se usa en el Route Handler de salud; leer la guía de Next antes de usarlo en páginas. |
| `SUPABASE_DB_PASSWORD` o la carpeta `supabase/.temp/` acaban en git          | `.env*` ya está ignorado; revisar el `.gitignore` que genera `supabase init` y verificar con `git status`.        |
| La CLI no puede enlazar el proyecto (red, contraseña, Windows)               | Los tipos también se pueden generar con el MCP `generate_typescript_types`; documentarlo si se usa.               |
| `database.types.ts` queda desactualizado al crear tablas                     | El script `npm run db:types` se ejecuta en cada spec que cambie el esquema.                                       |
| La ruta de salud expone información interna                                  | Respuesta con un mensaje genérico y el detalle solo en `console.error`.                                           |

## Lo que **no** entra en esta spec

- Tablas, migraciones, RLS o triggers.
- Supabase Auth, perfiles, `proxy.ts` o cambios en `lib/session.ts` y `/auth`.
- Puntuaciones en base de datos o leaderboards reales.
- Realtime y Edge Functions.
- Stack local con Docker y la clave secreta.

Cada uno, si llega, va en su propia spec.
