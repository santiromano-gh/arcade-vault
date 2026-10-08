# SPEC 01 — MVP visual: pantallas de Arcade Vault

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-10-08
> **Objetivo:** Portar a Next.js (App Router) las cinco pantallas de `references/templates/` como rutas reales, con datos mock y sin implementar ningún juego.

## Por qué existe esta spec

La plantilla de `references/templates/` es un SPA en un solo HTML (React UMD + Babel en el navegador) que navega guardando la ruta en el hash. Los estilos ya están portados a `app/globals.css` y las fuentes a `app/layout.tsx`. Falta llevar el marcado y el comportamiento visual a componentes TypeScript sobre rutas de App Router, para tener un MVP navegable sobre el que construir los juegos en specs futuras.

## Alcance

**Entra:**

- Nav global (logo, enlaces Biblioteca / Salón de la Fama, contador de créditos fijo `CRÉDITOS · 03`, botón de sesión, menú hamburguesa con panel lateral móvil) y footer global, ambos en `app/layout.tsx`.
- Pantalla **Biblioteca** en `/`: hero, buscador por nombre, chips de categoría, grilla de tarjetas con efecto tilt y estado vacío "NO HAY RESULTADOS".
- Pantalla **Detalle** en `/juegos/[id]`: portada, tags, descripción, stat strip, botones "JUGAR AHORA" y "VOLVER AL VAULT", leaderboard mock de 10 filas.
- Pantalla **Reproductor** en `/juegos/[id]/jugar`: HUD (jugador, puntuación, vidas, nivel), arena CRT decorativa, puntaje simulado con timer, pausa, botón FIN, modal de fin de juego con guardado de puntuación en localStorage, "JUGAR DE NUEVO" y "VOLVER AL VAULT".
- Pantalla **Auth** en `/auth`: pestañas Iniciar sesión / Crear cuenta, formulario, "JUGAR COMO INVITADO", botones sociales decorativos.
- Pantalla **Salón de la Fama** en `/salon`: pestañas por juego (estado local), podio top 3, tabla de 12 filas y fila "TU MEJOR MARCA" si hay sesión.
- Página 404 estilizada (`app/not-found.tsx`) usada para ids de juego inexistentes.
- Sesión mock en localStorage (clave `av_user`) compartida entre Nav, Auth, Reproductor y Salón.
- Datos mock tipados (`GAMES`, `CATS`, `seededScores`) portados desde `data.jsx`.
- Reemplazo de la página de plantilla de `create-next-app` en `app/page.tsx`.

**Fuera de alcance (para specs futuras):**

- Implementar cualquier juego real (la arena del reproductor es decorativa).
- Autenticación real, backend, base de datos o API.
- Login social funcional (Google / GitHub).
- Que el Salón de la Fama o los leaderboards lean las puntuaciones guardadas en `av_scores`.
- Sistema de créditos funcional.
- Validación de formularios más allá de la nativa del navegador.
- Runner de tests y tests automatizados.

## Modelo de datos

Datos estáticos en `lib/games.ts`, portados de `references/templates/data.jsx` sin cambiar valores:

```ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;          // slug usado en la URL: "bloque-buster", "caida", …
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;       // clase CSS de portada: "cover-bricks", …
  color: GameColor;
  best: number;
  plays: string;       // "12.4K"
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;        // "DD/MM/2026"
}

export const GAMES: Game[];                 // 8 juegos
export const CATS: readonly ["TODOS", ...GameCategory[]];
export function getGame(id: string): Game | undefined;
export function seededScores(seed: number, count?: number): ScoreRow[]; // determinista
export function scoreSeed(id: string, context: "detalle" | "salon"): number; // hash del id completo
```

Sesión y puntuaciones en `lib/session.ts` (solo cliente):

```ts
export interface SessionUser { name: string } // mayúsculas, máx. 10 caracteres

// localStorage
// "av_user"   → SessionUser | null
// "av_scores" → Array<{ game: string; score: number; name: string; at: number }>
```

Convenciones:

- Las claves `av_user` y `av_scores` son las mismas que usa la plantilla.
- Todo acceso a localStorage va envuelto en `try/catch`. Si falla, la app se comporta como sin sesión.
- La sesión se expone con un hook (`useSession`) basado en `useSyncExternalStore`, para que Nav y las pantallas se actualicen al iniciar o cerrar sesión sin recargar.
- Números formateados con `toLocaleString("es-ES")`, igual que la plantilla.

## Plan de implementación

1. Crear `lib/games.ts` con tipos, `GAMES`, `CATS`, `getGame` y `seededScores`. Verificar con `npm run build`.
2. Crear `lib/session.ts` con lectura/escritura de `av_user`, `signIn`, `signOut`, `saveScore` y el hook `useSession`.
3. Crear `components/nav.tsx` (client) con enlaces `next/link`, estado activo según `usePathname` (Biblioteca activa también en `/juegos/*`), botón de sesión y panel móvil. Crear `components/footer.tsx`. Montarlos en `app/layout.tsx` envolviendo `children` en `<main className="av-main">`.
4. Crear `components/game-card.tsx` (client, efecto tilt) y `components/library.tsx` (client, búsqueda + chips + grilla + estado vacío). Reemplazar `app/page.tsx` por el hero y `<Library />`. Manual: `/` muestra 8 tarjetas y filtra.
5. Crear `app/juegos/[id]/page.tsx` (detalle) con `generateStaticParams` sobre `GAMES` y `notFound()` si `getGame` devuelve `undefined`. Crear `components/leaderboard.tsx`. Crear `app/not-found.tsx` estilizado.
6. Crear `app/juegos/[id]/jugar/page.tsx` que resuelve el juego (o `notFound()`) y renderiza `components/game-player.tsx` (client) con HUD, arena CRT, timer de puntaje, pausa, modal de fin y `saveScore`.
7. Crear `app/auth/page.tsx` con `components/auth-form.tsx` (client): pestañas, campos, submit que llama `signIn` y navega a `/`, botón invitado que llama `signOut` y navega a `/`.
8. Crear `app/salon/page.tsx` con `components/hall-of-fame.tsx` (client): pestañas por juego, podio, tabla y fila "TU MEJOR MARCA" cuando hay sesión.
9. Ejecutar `npm run lint` y `npm run build` y corregir errores.

Antes de escribir código específico de Next (params como Promise, `generateStaticParams`, `notFound`, comportamiento con `cacheComponents`), leer la guía en `node_modules/next/dist/docs/`.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores.
- [ ] `npm run lint` termina sin errores.
- [ ] `/` muestra el hero "ARCADE VAULT" y 8 tarjetas de juego.
- [ ] Escribir "caí" en el buscador deja solo la tarjeta CAÍDA.
- [ ] Pulsar el chip SHOOTER deja solo INVASORES y ROCAS.
- [ ] Una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Pulsar una tarjeta o su botón JUGAR navega a `/juegos/<id>`.
- [ ] `/juegos/caida` muestra título, descripción larga, stat strip y un leaderboard de 10 filas.
- [ ] Recargar `/juegos/caida` muestra el mismo leaderboard (datos deterministas).
- [ ] `/juegos/no-existe` y `/juegos/no-existe/jugar` muestran la 404 estilizada.
- [ ] "JUGAR AHORA" navega a `/juegos/<id>/jugar` y la puntuación del HUD sube sola.
- [ ] PAUSA detiene la puntuación y muestra "EN PAUSA"; REANUDAR la reanuda.
- [ ] FIN abre el modal "FIN DEL JUEGO" con la puntuación final.
- [ ] "GUARDAR PUNTUACIÓN" añade una entrada a `av_scores` en localStorage y muestra "PUNTUACIÓN GUARDADA".
- [ ] "JUGAR DE NUEVO" reinicia puntuación a 0, vidas a 3 y nivel a 01.
- [ ] Sin sesión, el HUD muestra "INVITADO".
- [ ] En `/auth`, la pestaña CREAR CUENTA muestra el campo de correo y la de INICIAR SESIÓN lo oculta.
- [ ] Enviar el formulario con usuario "px_kai" navega a `/` y el nav muestra "PX_KAI ▾" sin recargar.
- [ ] Pulsar "PX_KAI ▾" cierra sesión y el nav vuelve a mostrar "Iniciar Sesión".
- [ ] Recargar la página conserva la sesión.
- [ ] `/salon` muestra podio y tabla de 12 filas; cambiar de pestaña cambia los datos.
- [ ] Con sesión, `/salon` muestra la fila "▸ TU MEJOR MARCA EN <JUEGO>"; sin sesión no aparece.
- [ ] El enlace del nav correspondiente a la ruta actual tiene la clase `active` (Biblioteca también en `/juegos/*`).
- [ ] A ancho de móvil (≤ 768px) aparece el botón ≡ y abre el panel lateral; pulsar el fondo lo cierra.
- [ ] El botón atrás del navegador vuelve a la pantalla anterior.
- [ ] No quedan restos de la plantilla de `create-next-app` en `app/page.tsx`.
- [ ] No hay errores de hidratación en la consola del navegador.

## Decisiones

- **Sí:** rutas reales de App Router (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth`, `/salon`). URLs compartibles, back nativo y prefetch.
- **No:** SPA con estado en el hash como la plantilla. No es idiomático en Next.
- **Sí:** sesión mock en localStorage con la clave `av_user`. Permite ver los estados con y sin sesión del nav y el salón sin backend.
- **No:** formulario de auth puramente decorativo. Ocultaría los estados con sesión de la UI.
- **Sí:** simulación del reproductor (puntaje con timer, pausa, FIN, modal) y guardado en `av_scores`. Fiel a la plantilla y deja el contrato listo para los juegos reales.
- **No:** reproductor estático. Perdería los estados de pausa y fin de juego.
- **Sí:** jugar sin sesión permitido; el HUD muestra "INVITADO".
- **Sí:** `notFound()` con `app/not-found.tsx` estilizado para ids inexistentes.
- **No:** redirigir a `/` en silencio. Oculta errores de enlace.
- **Sí:** pestaña del Salón en estado local (`useState`). Evita `searchParams` dinámicos y Suspense extra con `cacheComponents`.
- **No:** pestaña en query `?juego=`. Se puede añadir en otra spec si se quiere compartir.
- **Sí:** `components/` y `lib/` en la raíz del repo, importados con el alias `@/*`.
- **Sí:** reutilizar las clases CSS ya portadas en `app/globals.css` en lugar de reescribirlas con utilidades de Tailwind. Garantiza fidelidad visual con la plantilla.
- **Sí:** las páginas son Server Components y solo las piezas interactivas son Client Components (`"use client"`).
- **Sí:** nombre del producto "Arcade Vault" (el prompt inicial decía "Arcade Bot"; se confirmó que es Arcade Vault).
- **Sí:** contador de créditos fijo en `03`, solo visual.
- **Sí:** la semilla de `seededScores` se calcula con `scoreSeed(id, contexto)`, un hash del id completo (decidido durante la implementación del paso 8). Cada juego tiene leaderboard y datos de salón propios, y siguen siendo deterministas.
- **No:** la semilla de la plantilla basada en `id.length`. `caida` y `rocas` miden lo mismo y mostraban datos idénticos, lo que incumplía "cambiar de pestaña cambia los datos". Los nombres y puntuaciones ya no coinciden con los de la plantilla.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Error de hidratación al leer localStorage en el render inicial | `useSyncExternalStore` con `getServerSnapshot` que devuelve `null`; el estado con sesión aparece tras hidratar. |
| `seededScores` o `Math.random` difieren entre servidor y cliente | `seededScores` es determinista; `Math.random` solo se usa dentro de efectos del reproductor. |
| Comportamiento de `params` / `generateStaticParams` distinto en Next 16.4 con `cacheComponents` | Leer `node_modules/next/dist/docs/` antes del paso 5. |
| localStorage bloqueado (modo privado) | Accesos envueltos en `try/catch`; la app sigue funcionando sin sesión ni guardado. |

## Lo que **no** entra en esta spec

- Ningún juego jugable.
- Autenticación real, backend o login social funcional.
- Leaderboards alimentados por puntuaciones reales (`av_scores`).
- Créditos funcionales.
- Tests automatizados.

Cada uno, si llega, va en su propia spec.
