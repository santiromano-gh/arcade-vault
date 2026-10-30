# SPEC 06 — Catálogo de juegos y leaderboard en Supabase

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 04, SPEC 05
> **Fecha:** 2026-10-30
> **Objetivo:** Mover el catálogo de juegos a una tabla `games` y las puntuaciones a una tabla `scores` en Supabase, para que inicio, biblioteca, detalle, juego y Salón de la Fama lean datos reales y "GUARDAR PUNTUACIÓN" escriba en la base de datos.

## Por qué existe esta spec

Hoy el catálogo es la constante `GAMES` de `lib/games.ts`, con `best` y `plays` inventados. Los rankings del detalle y del Salón salen de `seededScores`, un generador determinista sin relación con las partidas. `saveScore` guarda en `localStorage` (`av_scores`) y nadie lo lee. La SPEC 04 dejó Supabase conectado pero con el esquema `public` vacío. Esta spec crea las dos primeras tablas y convierte Supabase en la única fuente de verdad del catálogo y de las puntuaciones. Todavía no hay Auth: las puntuaciones se firman con el nombre de la sesión mock o con las iniciales del modal.

## Alcance

**Entra:**

- Migración con la tabla `games`, la tabla `scores`, las vistas `game_stats` y `leaderboard`, los enums `game_category` y `game_color`, CHECKs y políticas RLS.
- Migración de seed:
  - Los 9 juegos actuales de `GAMES` con los mismos textos, portada, categoría, color y orden (`sort_order` 1–9).
  - 12 puntuaciones mock por cada uno de los 8 juegos mock, con los nombres de jugador actuales (`PX_KAI`, `NEONFOX`, …) y fechas de 2026.
  - `asteroides` sin puntuaciones.
- Migraciones versionadas en `supabase/migrations/` y aplicadas al proyecto remoto con la CLI.
- Regenerar `lib/supabase/database.types.ts` con `npm run db:types`.
- Cliente de lectura pública sin cookies, `lib/supabase/public.ts`, para poder usarlo dentro de `"use cache"`.
- Capa de datos en `lib/games.ts`:
  - `getGames()` y `getGame(id)` leen `games` + `game_stats`, con `"use cache"` y `cacheTag("games")` / `cacheTag("scores")`.
  - `getLeaderboard(gameId, limit)` lee la vista `leaderboard`, con `"use cache"` y `cacheTag("scores")`.
  - Se eliminan `GAMES`, `PLAYERS`, `scoreSeed` y `seededScores`. Se conservan los tipos `Game`, `GameCategory`, `GameColor`, `ScoreRow` y la constante `CATS`.
- `best` = mayor puntuación del juego y `plays` = número de filas en `scores`, calculados por `game_stats`. `plays` se muestra abreviado (`12.4K`) con `formatPlays` en `lib/games.ts`.
- Pantallas que pasan a leer de Supabase:
  - Inicio (`app/page.tsx`): los 6 primeros juegos por `sort_order`.
  - Biblioteca (`/biblioteca`): `Library` recibe los juegos por props.
  - Detalle (`/juegos/<id>`): datos del juego, "Partidas" y "Mejor global" reales, y `Leaderboard` con el top 10 real.
  - Jugar (`/juegos/<id>/jugar`): `generateStaticParams` y `getGame` desde Supabase.
  - Salón (`/salon`): `HallOfFame` recibe los juegos y el top 12 de cada juego por props.
- Ranking por mejor marca por jugador: una fila por `player_name` con su máximo; empate resuelto por la fecha más antigua. Top 10 en el detalle y top 12 en el Salón.
- Fila "TU MEJOR MARCA" del Salón real: con sesión mock, consulta en el navegador la vista `leaderboard` filtrando por juego y por el nombre de la sesión, y muestra rango, puntuación y fecha reales. Si el jugador no tiene marca en ese juego, muestra "SIN MARCA TODAVÍA".
- Guardado real:
  - Server Action `submitScore` en `app/juegos/[id]/jugar/actions.ts`.
  - Valida que el juego existe, que el nombre normalizado tiene de 1 a 10 caracteres y que la puntuación es un entero entre 0 y 10.000.000.
  - Inserta en `scores` con el cliente de servidor e invalida el tag `scores`.
  - Devuelve `{ ok: true }` o `{ ok: false, error }` con un mensaje genérico.
- Modal "FIN DEL JUEGO" de `GamePlayer`: estados "GUARDANDO…", "PUNTUACIÓN GUARDADA" y error con reintento. El botón queda deshabilitado mientras guarda.
- Se eliminan `saveScore`, `SavedScore` y la clave `av_scores` de `lib/session.ts`. La sesión mock (`av_user`) no cambia.
- Estados de la interfaz, diseñados con `/frontend-design` respetando el lenguaje visual CRT existente:
  - Ranking vacío: "SIN PUNTUACIONES TODAVÍA" en el detalle y en la pestaña del Salón.
  - Error de carga: `app/error.tsx` con el mensaje "NO SE PUDO CARGAR EL VAULT" y un botón "REINTENTAR".

**Fuera de alcance (para specs futuras):**

- Supabase Auth, perfiles y vincular puntuaciones a usuarios reales.
- Realtime (rankings que se actualizan en vivo).
- Validación antitrampas en servidor, rate limiting o captcha.
- Edición o borrado de puntuaciones y juegos desde la app (panel de administración).
- Copia local del catálogo como respaldo si Supabase falla.
- Cambiar textos, portadas o el orden de los juegos.
- Rankings o ticker de la página de inicio (siguen como están, salvo la lista de juegos).
- Migrar los datos que ya existan en `av_scores` del navegador.
- Stack local con Docker y la clave secreta (`service_role`).
- Tests automatizados.

## Modelo de datos

Esquema SQL (resumen; la migración es la fuente de verdad):

```sql
create type game_category as enum ('ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS');
create type game_color as enum ('cyan', 'magenta', 'yellow', 'green');

create table games (
  id          text primary key,              -- slug: 'bloque-buster', 'asteroides', …
  title       text not null,
  short       text not null,
  long        text not null,
  cat         game_category not null,
  cover       text not null,                 -- clase CSS: 'cover-bricks', …
  color       game_color not null,
  sort_order  integer not null unique,
  created_at  timestamptz not null default now()
);

create table scores (
  id           bigint generated always as identity primary key,
  game_id      text not null references games (id),
  player_name  text not null
               check (char_length(player_name) between 1 and 10 and player_name = upper(player_name)),
  score        integer not null check (score between 0 and 10000000),
  created_at   timestamptz not null default now()
);
create index scores_game_score_idx on scores (game_id, score desc);

-- Ambas vistas con security_invoker = true para que respeten RLS.
-- game_stats: game_id, best (max(score), 0 si no hay filas), plays (count(*)).
-- leaderboard: game_id, player_name, score (mejor marca), created_at (fecha de esa marca),
--              rank (row_number por juego ordenado por score desc, created_at asc).
```

RLS:

| Tabla    | `anon` puede                             |
| -------- | ---------------------------------------- |
| `games`  | `select`                                 |
| `scores` | `select`, `insert` (limitado por CHECKs) |

Nadie tiene `update` ni `delete` desde la API.

Tipos de la app (`lib/games.ts`). `Game` mantiene su forma; solo cambia el tipo de `plays`:

```ts
export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;
  color: GameColor;
  best: number; // game_stats.best
  plays: number; // game_stats.plays; se formatea con formatPlays al mostrarlo
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // "DD/MM/AAAA", desde created_at
}
```

Contrato de la Server Action:

```ts
// app/juegos/[id]/jugar/actions.ts
"use server";
export async function submitScore(input: {
  gameId: string;
  name: string;
  score: number;
}): Promise<{ ok: true } | { ok: false; error: string }>;
```

Tags de caché: `games` (catálogo) y `scores` (rankings, `best` y `plays`).

Archivos nuevos:

```
supabase/migrations/<timestamp>_games_scores.sql
supabase/migrations/<timestamp>_seed_games_scores.sql
lib/supabase/public.ts
app/juegos/[id]/jugar/actions.ts
app/error.tsx
```

Archivos modificados:

```
lib/supabase/database.types.ts   // regenerado
lib/games.ts                     // capa de datos; sin GAMES ni seededScores
lib/session.ts                   // sin saveScore ni av_scores
app/page.tsx
app/biblioteca/page.tsx
app/juegos/[id]/page.tsx
app/juegos/[id]/jugar/page.tsx
app/salon/page.tsx
components/library.tsx           // juegos por props
components/hall-of-fame.tsx      // juegos y rankings por props; mejor marca real
components/leaderboard.tsx       // estado vacío
components/game-card.tsx         // plays con formatPlays si se muestra
components/game-player.tsx       // submitScore y estados del modal
app/globals.css                  // estados vacío y error
CLAUDE.md                        // nota sobre tablas, migraciones y tags de caché
```

## Plan de implementación

1. Crear la migración `<timestamp>_games_scores.sql` con `npx supabase migration new`: enums, tablas, índice, vistas con `security_invoker` y políticas RLS. Aplicarla con `npx supabase db push`. Comprobar con `list_tables` y `get_advisors` (seguridad) que no hay avisos.
2. Crear la migración de seed con los 9 juegos y las 96 puntuaciones mock, y aplicarla. Comprobar con SQL que `games` tiene 9 filas, que `scores` tiene 96 y que `asteroides` no tiene ninguna.
3. Ejecutar `npm run db:types` y verificar que `database.types.ts` incluye `games`, `scores`, `game_stats` y `leaderboard`.
4. Crear `lib/supabase/public.ts`: cliente `createClient<Database>` de `@supabase/supabase-js` con la publishable key, sin cookies ni sesión persistida. Solo para lecturas públicas.
5. Reescribir `lib/games.ts` con `getGames`, `getGame`, `getLeaderboard` y `formatPlays`, usando `"use cache"` y `cacheTag`. Mantener temporalmente `GAMES` y `seededScores` para que el build siga pasando.
6. Migrar inicio, biblioteca y las dos rutas de `/juegos/[id]` a `getGames` / `getGame`, incluido `generateStaticParams`. `Library` recibe `games` por props. El detalle usa `getLeaderboard(id, 10)`, y `Leaderboard` muestra el estado vacío si no hay filas.
7. Migrar el Salón: `app/salon/page.tsx` carga los juegos y el top 12 de cada uno, y los pasa a `HallOfFame`. "TU MEJOR MARCA" consulta `leaderboard` con el cliente de navegador y muestra "SIN MARCA TODAVÍA" si no hay fila. Estado vacío por pestaña.
8. Eliminar `GAMES`, `PLAYERS`, `scoreSeed` y `seededScores` de `lib/games.ts` cuando ya nadie los importe.
9. Crear `submitScore` en `app/juegos/[id]/jugar/actions.ts` con la validación descrita, el insert con el cliente de servidor y la invalidación del tag `scores`. Antes, leer en `node_modules/next/dist/docs/` la guía de Server Actions y la de invalidación (`updateTag` / `revalidateTag`) para elegir la función correcta.
10. Conectar el modal de `GamePlayer` a `submitScore` con los estados guardando / guardado / error y reintento. Eliminar `saveScore`, `SavedScore` y `av_scores` de `lib/session.ts`.
11. Crear `app/error.tsx` y los estilos de los estados vacío y error en `app/globals.css`, diseñados con `/frontend-design`.
12. Actualizar `CLAUDE.md` (sección "Stack y configuración") con las tablas, la carpeta de migraciones, `lib/supabase/public.ts` y los tags de caché.
13. Ejecutar `npm run lint` y `npm run build`, corregir errores y probar a mano el flujo de guardar en `/juegos/asteroides/jugar`.

Antes de escribir código específico de Next (`"use cache"`, `cacheTag`, Server Actions, `error.tsx`, `generateStaticParams` con datos remotos), leer la guía correspondiente en `node_modules/next/dist/docs/`. Para RLS, vistas y migraciones, consultar la documentación de Supabase con el MCP `search_docs`.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores.
- [ ] `npm run lint` termina sin errores.
- [ ] `supabase/migrations/` contiene las dos migraciones versionadas y `npx supabase db push` no tiene cambios pendientes.
- [ ] `games` tiene 9 filas con los mismos `id`, `title`, `short`, `long`, `cat`, `cover` y `color` que la antigua constante `GAMES`, y `sort_order` del 1 al 9 en el mismo orden.
- [ ] `scores` tiene 12 filas por cada juego mock y ninguna para `asteroides` tras aplicar el seed.
- [ ] `get_advisors` (seguridad) no reporta avisos sobre `games`, `scores`, `game_stats` ni `leaderboard`.
- [ ] Con la publishable key, un `update` o `delete` sobre `scores` o `games` falla o no afecta a ninguna fila.
- [ ] Con la publishable key, un `insert` en `scores` con `player_name` en minúsculas, de más de 10 caracteres, con `score` negativo o con un `game_id` inexistente falla.
- [ ] `lib/supabase/database.types.ts` incluye `games`, `scores`, `game_stats` y `leaderboard`.
- [ ] `git grep -n "GAMES\b\|seededScores\|scoreSeed\|saveScore\|av_scores"` no devuelve coincidencias en `app/`, `components/` ni `lib/`.
- [ ] Inicio muestra los 6 primeros juegos por `sort_order`; biblioteca muestra los 9, y los filtros por categoría funcionan igual que antes.
- [ ] En `/juegos/<id>`, "Partidas" y "Mejor global" coinciden con `count(*)` y `max(score)` de `scores` para ese juego.
- [ ] `/juegos/asteroides` muestra "Partidas" 0, "Mejor global" 0 y "SIN PUNTUACIONES TODAVÍA" mientras no haya filas.
- [ ] El leaderboard del detalle muestra como máximo 10 filas y el del Salón como máximo 12, ordenadas por puntuación descendente.
- [ ] Si un jugador tiene varias puntuaciones en un juego, aparece una sola vez en el ranking, con la mayor.
- [ ] Detalle y Salón muestran el mismo orden para el mismo juego.
- [ ] `/juegos/no-existe` y `/juegos/no-existe/jugar` siguen mostrando la 404.
- [ ] Al guardar una puntuación en `/juegos/asteroides/jugar`, el modal muestra "GUARDANDO…" y luego "PUNTUACIÓN GUARDADA", y aparece una fila nueva en `scores` con `game_id = 'asteroides'`.
- [ ] Tras guardar, la siguiente visita a `/juegos/asteroides` y a `/salon` muestra la puntuación nueva, y "Partidas" y "Mejor global" se actualizan, sin reiniciar el servidor.
- [ ] Si el guardado falla (por ejemplo, sin red), el modal muestra un error con opción de reintentar y no aparece "PUNTUACIÓN GUARDADA".
- [ ] El botón de guardar no envía dos veces la misma puntuación si se pulsa repetidamente.
- [ ] Llamar a `submitScore` con una puntuación no entera, negativa, mayor que 10.000.000, un nombre vacío o un juego inexistente devuelve `{ ok: false }` y no inserta nada.
- [ ] Con sesión mock y una marca guardada, "TU MEJOR MARCA" del Salón muestra el rango, la puntuación y la fecha reales de ese jugador en la pestaña activa.
- [ ] Con sesión mock y sin marcas en el juego, la fila muestra "SIN MARCA TODAVÍA". Sin sesión, la fila no aparece.
- [ ] Con una URL o clave de Supabase inválida, las páginas del catálogo muestran "NO SE PUDO CARGAR EL VAULT" con un botón "REINTENTAR", sin traza ni claves.
- [ ] No hay errores de hidratación ni de consola en `/`, `/biblioteca`, `/juegos/<id>`, `/juegos/<id>/jugar` y `/salon`.

## Decisiones

- **Sí:** tabla `games` como única fuente de verdad del catálogo. Decisión del usuario; prepara añadir juegos sin tocar código.
- **No:** usar `games` solo como clave foránea y mantener la constante `GAMES`. Dejaría dos catálogos que pueden divergir.
- **No:** copia local del catálogo como respaldo. Decisión del usuario; si Supabase falla se muestra un error visible.
- **Sí:** leaderboard real en el detalle y en el Salón. Decisión del usuario; son las dos pantallas que ya muestran rankings.
- **No:** cambiar los rankings o el ticker de inicio. Quedan para otra spec.
- **Sí:** Server Action `submitScore` con validación. Decisión del usuario; centraliza las reglas antes de tocar la base de datos.
- **Sí:** RLS con `insert` para `anon` más CHECKs en la tabla. Decisión del usuario; no requiere claves nuevas y los CHECKs protegen también contra llamadas directas a la API.
- **No:** función RPC `SECURITY DEFINER` ni secret key en servidor. Más SQL o una clave privilegiada que la SPEC 04 dejó fuera, sin beneficio real mientras no haya Auth.
- **Sí:** `best` y `plays` calculados por la vista `game_stats`. Decisión del usuario; reflejan las partidas guardadas.
- **No:** columnas `best` y `plays` fijas en `games`. Serían números inventados que no cambian.
- **Sí:** `plays` pasa a `number` y se formatea con `formatPlays`. El dato y su presentación quedan separados.
- **Sí:** seed con 12 puntuaciones mock por cada juego mock. Decisión del usuario; los rankings no se ven vacíos.
- **Sí:** `asteroides` empieza sin puntuaciones. Decisión del usuario; es el único juego real y su ranking debe contener solo partidas reales.
- **Sí:** ranking por mejor marca por jugador, con desempate por la fecha más antigua. Decisión del usuario; evita que un jugador llene la tabla.
- **Sí:** "TU MEJOR MARCA" real, buscada por el nombre de la sesión mock. Decisión del usuario. Sin Auth, dos personas con el mismo nombre comparten marca; se acepta hasta la spec de Auth.
- **Sí:** eliminar `saveScore` y `av_scores`. Decisión del usuario; nadie los leía y Supabase los sustituye.
- **Sí:** `"use cache"` con tags `games` y `scores`, e invalidación de `scores` desde la Server Action. Decisión del usuario; la puntuación nueva aparece en la siguiente visita.
- **No:** Realtime. Merece su propia spec.
- **Sí:** cliente público sin cookies (`lib/supabase/public.ts`) para las lecturas cacheadas. `cookies()` no se puede usar dentro de `"use cache"`, y las lecturas del catálogo no dependen del usuario.
- **Sí:** `sort_order` en `games`. Decisión del usuario; conserva el orden actual y los 6 juegos destacados de inicio.
- **Sí:** enums Postgres para `cat` y `color`. Coinciden con los tipos `GameCategory` y `GameColor` y los genera `db:types`.
- **Sí:** los juegos mock también pueden guardar puntuaciones. Es el comportamiento actual del modal; sus puntuaciones son simuladas, igual que antes.
- **Sí:** migraciones con la CLI (`supabase migration new` + `db push`) versionadas en git. Sigue la decisión de la SPEC 04 de tener `supabase/` en el repositorio.

## Riesgos

| Riesgo                                                                                        | Mitigación                                                                                                                       |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Cualquiera puede insertar puntuaciones falsas con la publishable key                          | CHECKs de rango y formato; se acepta mientras no haya Auth. Antitrampas y rate limiting quedan para otra spec.                   |
| `npm run build` falla si Supabase no responde, porque `generateStaticParams` consulta la base | Se documenta en `CLAUDE.md`; el error de build nombra la causa. Sin copia local por decisión del usuario.                        |
| Las vistas se crean sin `security_invoker` y se saltan RLS                                    | Crearlas con `security_invoker = true` y verificar con `get_advisors`.                                                           |
| Usar el cliente de servidor (con `cookies()`) dentro de `"use cache"` rompe el build          | Las lecturas cacheadas usan solo `lib/supabase/public.ts`; el cliente con cookies queda para la Server Action.                   |
| La puntuación nueva no aparece porque no se invalida la caché correcta                        | Todas las lecturas que dependen de `scores` llevan `cacheTag("scores")`; hay un criterio de aceptación para verlo sin reiniciar. |
| Doble clic en guardar inserta dos filas                                                       | El botón se deshabilita mientras la acción está en curso.                                                                        |
| Nombres repetidos sin Auth mezclan marcas de personas distintas                               | Aceptado y documentado; se resuelve con la spec de Auth.                                                                         |
| `database.types.ts` queda desactualizado                                                      | `npm run db:types` forma parte del plan y de los criterios de aceptación.                                                        |

## Lo que **no** entra en esta spec

- Supabase Auth y puntuaciones vinculadas a usuarios reales.
- Realtime.
- Antitrampas, rate limiting o captcha.
- Panel de administración para editar juegos o puntuaciones.
- Copia local del catálogo como respaldo.
- Rankings o ticker de la página de inicio.
- Migrar los datos antiguos de `av_scores`.

Cada uno, si llega, va en su propia spec.
