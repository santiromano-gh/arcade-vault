# CLAUDE.md

Este archivo orienta a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

@AGENTS.md

## Idioma

Todo el trabajo en este repositorio debe hacerse en **español**: respuestas al usuario, specs, documentación, comentarios en el código, mensajes de commit y descripciones de PR. Los identificadores del código (variables, funciones, componentes, archivos) pueden seguir las convenciones existentes.

## Proyecto

Arcade Vault es una plataforma para jugar online juegos arcade en canvas y competir por la mayor puntuación. Se desarrolla con **Spec Driven Design**: las funcionalidades se especifican con `/spec` y se implementan con `/spec-impl`, siguiendo las buenas prácticas de https://github.com/Klerith/fernando-skills (instaladas con `npx skills@latest add Klerith/fernando-skills`).

### Specs

Viven en `specs/NN-<slug>.md` con un estado en la cabecera (`Borrador` → `Aprobado` → `Implementado`). `/spec-impl` crea la rama `spec-NN-<slug>` automáticamente (`specs/.spec-config.yml`, `AutoCreateBranch: true`).

| Spec | Contenido                                                     |
| ---- | ------------------------------------------------------------- |
| 01   | MVP visual: pantallas de la plataforma                        |
| 02   | Pantalla de inicio en `/`; la Biblioteca pasa a `/biblioteca` |
| 03   | Página "Acerca de" y formulario de contacto con Resend        |
| 04   | Integración base con Supabase                                 |
| 05   | Juego ASTEROIDES (motor en canvas)                            |
| 06   | Catálogo y leaderboard en Supabase                            |
| 07   | Juego TETRIS (motor en canvas)                                |

Antes de escribir una spec nueva, lee las dos más recientes para seguir sus convenciones.

### Rutas

- `/` inicio (muestra los 6 primeros juegos por `sort_order`), `/biblioteca` catálogo con filtro por categoría (`CATS`), `/juegos/[id]` detalle con leaderboard, `/juegos/[id]/jugar` reproductor, `/salon` Salón de la fama (top 12 por juego y "TU MEJOR MARCA"), `/acerca-de` con formulario de contacto, `/auth` inicio de sesión mock.
- `app/api/contact/route.ts`: envía el formulario de contacto con **Resend** (valida longitudes y formato, campo trampa `sitio_web` antispam).
- `app/api/health/supabase/route.ts`: comprobación de conexión con Supabase, siempre dinámica.
- `app/error.tsx` y `app/not-found.tsx`: pantallas de error y 404.

### Juegos y motores

- Cada juego jugable es un motor en canvas bajo `lib/engines/<id>/` que implementa el contrato de `lib/engines/types.ts` (`CreateEngine`, `GameEngine`, `EngineCallbacks`, `GameStats`). Hoy hay dos: `asteroides` y `tetris`.
- `lib/engines/index.ts` es el registro `ENGINES` (`game.id` → `{ load, controls, lives }`). Cada motor se carga con `import()` dinámico: nunca con import estático.
- La plataforma ya resuelve, y el motor no debe duplicar: `components/game-canvas.tsx` (buffer con `devicePixelRatio`, ciclo de vida compatible con Strict Mode) y `components/game-player.tsx` (HUD, pausa con P, `visibilitychange`, FIN, SALIR, modal y guardado con `submitScore`).
- El motor nunca habla con Supabase: solo notifica a React con `onStats` / `onGameOver`.
- Resolución lógica 800×600 (4:3). Las reglas de integración, las trampas de portado y los límites de la plataforma están en `.claude/skills/nuevo-juego/integracion.md`.
- `references/` contiene prototipos (`02-asteroids`, `03-tetris`, `04-arkanoid`), el mock de diseño (`templates/`) y el To Do de sugerencias de juegos (`game-suggestions-todo.md`, lo mantiene el agente `game-planner`). No es código de la app: ESLint lo ignora; ignora también `__MACOSX/`.

### Sesión

`lib/session.ts` es una sesión **mock** en `localStorage` (`av_user`, nombre en mayúsculas, máx. 10 caracteres) expuesta con `useSession()`. No hay autenticación real: las puntuaciones se guardan con el nombre de esa sesión.

## Skills

- Usa siempre `/frontend-design` para diseñar la interfaz del usuario, respetando el lenguaje visual CRT existente (`app/globals.css`).
- `/spec` y `/spec-impl` (globales, de fernando-skills): especificar e implementar funcionalidades.
- `/nuevo-juego <nombre o carpeta de references>` (del proyecto, `.claude/skills/nuevo-juego/`): entrevista al usuario y escribe la spec de un juego nuevo en estado `Borrador`, con motor, migración de catálogo y leaderboard. No escribe código; después se aprueba y se ejecuta `/spec-impl NN-juego-<id>`. Solo se invoca manualmente.

## Agentes

Viven en `.claude/agents/`.

- **`game-planner`** (`.claude/agents/game-planner.md`): planifica y decide qué juego encaja con la plataforma. Es el paso previo a `/nuevo-juego`: **`game-planner` → `/nuevo-juego <id>` → aprobar la spec → `/spec-impl NN-juego-<id>`**.
  - Propone 2 o 3 candidatos, recomienda uno y lo compara con una tabla de criterios. Los prioritarios son diversidad de categorías (evita las ya cubiertas y prioriza géneros que faltan, como RACING, RPG o FIGHTING), factibilidad en Canvas 2D con el stack actual y reconocimiento clásico (mecánicas arcade icónicas, siempre con nombre, estética y giro de diseño propios, sin copiar juegos existentes).
  - Memoria persistente (`memory: project`) en `.claude/agent-memory/game-planner/`, versionada en git: guarda preferencias y motivos de aceptación o rechazo.
  - Registra sus sugerencias en el To Do `references/game-suggestions-todo.md` (pendiente, en spec, implementado, descartado) y nunca borra entradas, para no repetir sugerencias.
  - Solo lee el repositorio (sin web ni Supabase) y solo modifica el To Do y su memoria: no escribe specs, código ni migraciones.
  - Se invoca pidiéndolo, por ejemplo: "usa game-planner para sugerir el próximo juego".

## Herramientas de Claude Code

- **Hook `PostToolUse`** (`.claude/settings.json` → `.claude/hooks/format-and-lint.mjs`): tras cada `Write`/`Edit` en el proyecto **elimina las líneas en blanco** del código (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.css`; respeta los template literals), ejecuta `eslint --fix` y formatea con Prettier. Markdown solo se formatea. Si ESLint deja errores, el hook falla y hay que corregirlos. No escribas código pensando en conservar líneas en blanco.
- **Prettier** (`.prettierrc.json`): comillas dobles, punto y coma, `printWidth` 100, `trailingComma: "all"`. El commit de normalización de formato está en `.git-blame-ignore-revs`.
- **MCP de Supabase** (`.mcp.json`): acceso al proyecto remoto para inspeccionar tablas, logs y advisors. Los cambios de esquema siguen yendo por migraciones versionadas (ver abajo).

## Comandos

```bash
npm run dev       # next dev (Turbopack) en http://localhost:3000
npm run build     # build de producción; valida tipos y consulta Supabase
npm run start     # sirve el build de producción
npm run lint      # eslint (config flat: next core-web-vitals + typescript)
npm run db:types  # regenera lib/supabase/database.types.ts
```

Todavía no hay un runner de tests configurado.

## Stack y configuración

- **Next.js 16.4 (App Router) + React 19.3**, TypeScript en modo estricto. Esta versión de Next difiere de los datos de entrenamiento: lee la guía correspondiente en `node_modules/next/dist/docs/` (`01-app/`, `03-architecture/`, …) antes de escribir código específico de Next.
- `next.config.ts` activa `cacheComponents`, `partialPrefetching`, `experimental.agentFeedback` y `experimental.agentUpgrade: "security"`. Con Cache Components activo, la obtención y caché de datos sigue el modelo `"use cache"` / Suspense; consulta la documentación en lugar de asumir el comportamiento antiguo del caché de `fetch` o de la configuración de segmentos de ruta.
- **Tailwind CSS v4** se integra mediante una regla de loader de Turbopack (`@tailwindcss/turbopack` sobre `*.css`), no con PostCSS. Los tokens del tema y las clases de portada (`cover-<id>`) viven en `app/globals.css` con `@import "tailwindcss"` y `@theme inline` (no hay `tailwind.config.*`).
- Los layouts y páginas usan los helpers de tipos globales `LayoutProps<"/">` / `PageProps` que genera Next (ver `app/layout.tsx`).
- El alias de ruta `@/*` apunta a la raíz del repositorio.
- **Variables de entorno** (plantilla en `.env.example`, valores en `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_DB_PASSWORD` (solo CLI), `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`. `lib/supabase/env.ts` valida las de Supabase y nombra la que falta.
- **Supabase** vía `@supabase/ssr`: `lib/supabase/client.ts` (navegador) y `lib/supabase/server.ts` (servidor, usa `cookies()`), tipados con `lib/supabase/database.types.ts`. Regenera los tipos con `npm run db:types` (requiere la CLI enlazada: `npx supabase login` + `npx supabase link`) cada vez que cambie el esquema.
- **Datos en Supabase** (SPEC 06), única fuente de verdad del catálogo y las puntuaciones:
  - Tablas `games` (catálogo, ordenado por `sort_order`, que es `unique`) y `scores` (una fila por partida guardada). Vistas `game_stats` (`best`, `plays`) y `leaderboard` (mejor marca por jugador con `rank`), ambas con `security_invoker`. RLS: `anon` solo puede leer y, en `scores`, insertar; nadie puede hacer `update` ni `delete` desde la API.
  - Enums `game_category` y `game_color`. Una categoría nueva exige `ALTER TYPE`, `npm run db:types` y añadirla a `CATS` en `lib/games-shared.ts`.
  - El esquema se cambia con migraciones versionadas en `supabase/migrations/`: `npx supabase migration new <nombre>` y `npx supabase db push --linked`. Después, `npm run db:types`. Las migraciones ya aplicadas no se editan; cada juego nuevo lleva su propia migración.
  - `lib/supabase/public.ts` es un cliente sin cookies para lecturas públicas; es el único que se puede usar dentro de `"use cache"`.
  - `lib/games-shared.ts` contiene tipos, `CATS`, `LEADERBOARD_COLUMNS` y formateadores (`toScoreRow`, `formatDate`, `formatPlays`) usables desde Client Components. `lib/games.ts` (`getGames`, `getGame`, `getLeaderboard`, `getLeaderboards`) es solo de servidor: cachea con `"use cache"` y los tags `games` (catálogo) y `scores` (rankings, `best` y `plays`), y reexporta `games-shared`.
  - Las escrituras usan el cliente de servidor en la Server Action `submitScore` (`app/juegos/[id]/jugar/actions.ts`), que valida la entrada (puntuación entera entre 0 y 10.000.000, nombre de 1 a 10 caracteres, juego existente) y después invalida con `updateTag("scores")`.
  - `npm run build` consulta Supabase (`generateStaticParams` y páginas prerenderizadas): sin conexión o con claves inválidas, el build falla. Aplica las migraciones antes de compilar.
