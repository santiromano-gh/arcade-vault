# SPEC 02 — Pantalla de inicio (landing)

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-11
> **Objetivo:** Añadir una pantalla de inicio (landing) en `/` portada de `references/templates/home-about/home.jsx`, moviendo la Biblioteca a `/biblioteca` y sin incluir nada de "Acerca de".

## Por qué existe esta spec

La carpeta `references/templates/home-about/` trae una plantilla ampliada con una landing (`home.jsx`), una página "Acerca de" (`about.jsx`), un `nav.jsx` con enlaces Inicio y Acerca de, y un `styles.css` que añade estilos de home, about, contacto y gamepad. Hoy `/` es la Biblioteca (SPEC 01). Esta spec porta solo la landing y reubica la Biblioteca para que el sitio tenga una portada de presentación.

## Alcance

**Entra:**

- Nueva pantalla **Inicio** en `/` (`app/page.tsx`) con estas secciones de `home.jsx`:
  - **Hero**: siluetas pixel flotantes (8 SVG decorativos), eyebrow "▸ INSERTA UNA MONEDA_", título en tres líneas, subtítulo, CTAs "▶ EXPLORAR JUEGOS" (→ `/biblioteca`) y "✦ CREAR CUENTA" (→ `/auth`), indicador "DESLIZA".
  - **// 01 ¿POR QUÉ ARCADE VAULT?**: 4 tarjetas con icono pixel (GAMEPAD, FREE, TROPHY, ROCKET).
  - **// 02 JUEGOS DISPONIBLES AHORA**: 6 mini-tarjetas (`GAMES.slice(0, 6)`) que enlazan a `/juegos/<id>`, y botón "VER TODOS LOS JUEGOS →" a `/biblioteca`.
  - **Stats**: 3 bloques de texto fijo (`12+ JUEGOS`, `MILES DE PARTIDAS`, `GLOBAL RANKING`).
  - **// 03 ACTIVIDAD EN VIVO**: "Últimas puntuaciones" (7 filas) y "Top jugadores · hoy" (5 filas, enlace "VER SALÓN →" a `/salon`), con los datos mock de la plantilla copiados tal cual.
  - **// 04 PRECIOS**: tarjeta "JUGADOR VAULT $0" con botón "EMPEZAR GRATIS →" (→ `/auth`) y 3 preguntas frecuentes.
  - **CTA final**: "¿LISTO PARA JUGAR?" y botón "INSERTAR MONEDA →" (→ `/biblioteca`).
- Animación de aparición al hacer scroll (`.reveal` + `IntersectionObserver`).
- Mover la Biblioteca actual (hero + buscador + chips + grilla) a `/biblioteca` (`app/biblioteca/page.tsx`).
- Nav: añadir el enlace **Inicio** (`/`) antes de Biblioteca, en la barra y en el panel móvil. Biblioteca pasa a `/biblioteca` y sigue activa también en `/juegos/*`. El logo enlaza a `/`.
- Actualizar los enlaces existentes que hoy apuntan a la Biblioteca como `/` ("VOLVER AL VAULT" en detalle, reproductor, salón y 404) para que apunten a `/biblioteca`.
- Tras iniciar sesión o entrar como invitado en `/auth`, la navegación va a `/biblioteca` (hoy va a `/`).
- Portar a `app/globals.css` solo los estilos de la landing, actividad y precios de `references/templates/home-about/styles.css`.

**Fuera de alcance:**

- Página "Acerca de", su enlace de nav, y los estilos de about, contacto, terminal de éxito y gamepad (`.about*`, `.highlight*`, `.contact*`, `.terminal-success`, `.gp*`).
- Datos reales para stats, actividad en vivo o top del día (todo es texto mock estático).
- Que "Actividad en vivo" se actualice o lea `av_scores`.
- Cambiar la sesión, los créditos o los juegos.
- Tests automatizados.

## Modelo de datos

No introduce estructuras en `lib/`. Los datos de la landing (features, stats, actividad, top, precios, FAQ) son constantes locales del componente de la pantalla, copiadas de `home.jsx` sin cambiar valores. Los juegos de la sección 02 se leen de `GAMES` (`lib/games.ts`).

Nota: "12+ JUEGOS" de la plantilla no coincide con los 8 juegos actuales; se copia tal cual por decisión del usuario (ver Decisiones).

## Plan de implementación

1. Portar estilos: copiar a `app/globals.css` los bloques de `references/templates/home-about/styles.css` correspondientes a `HOME PAGE` (hasta `.reveal.in`), `ACTIVITY` y precios/FAQ, más cualquier clase usada por `home.jsx` que falte (`.lb-link`, `.ticker`, `.price-card`, `.faq-*`, `.pc-*`). Omitir `ABOUT PAGE` y `GAMEPAD`. Mantener el estilo de bloques ya existente. Verificar con `npm run build`.
2. Mover la Biblioteca: crear `app/biblioteca/page.tsx` con el contenido actual de `app/page.tsx`. Verificar que `/biblioteca` funciona igual que antes.
3. Actualizar enlaces: `components/nav.tsx` (Inicio en `/`, Biblioteca en `/biblioteca`, estado activo: `/` → inicio; `/biblioteca` y `/juegos/*` → biblioteca; logo a `/`), "VOLVER AL VAULT" en `app/juegos/[id]/page.tsx`, `components/game-player.tsx`, `app/salon/page.tsx` y `app/not-found.tsx` a `/biblioteca`, y `components/auth-form.tsx` (`router.push("/biblioteca")`).
4. Crear `components/home-silhouettes.tsx` (SVG decorativos, `aria-hidden`), `components/feature-icon.tsx` y `components/mini-card.tsx` (enlace `next/link`).
5. Crear `components/reveal.tsx` (client) que aplica `.reveal` y añade `.in` con `IntersectionObserver` (umbral 0.12, una sola vez; sin `IntersectionObserver` o con `prefers-reduced-motion`, muestra el contenido de inmediato).
6. Reemplazar `app/page.tsx` por la landing (Server Component) componiendo las secciones; solo `Reveal` es client. Los botones son `Link` con las clases `btn`.
7. Ejecutar `npm run lint` y `npm run build`, y corregir errores.

Antes de escribir código específico de Next, leer la guía relevante en `node_modules/next/dist/docs/`. Para el diseño de la interfaz usar `/frontend-design`, partiendo de la plantilla.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores.
- [ ] `npm run lint` termina sin errores.
- [ ] `/` muestra el título "EL ARCADE CLÁSICO ESTÁ DE VUELTA" y los CTAs "EXPLORAR JUEGOS" y "CREAR CUENTA".
- [ ] "EXPLORAR JUEGOS" navega a `/biblioteca`; "CREAR CUENTA" navega a `/auth`.
- [ ] `/` muestra 4 tarjetas de "¿POR QUÉ ARCADE VAULT?".
- [ ] `/` muestra 6 mini-tarjetas y pulsar una navega a `/juegos/<id>`.
- [ ] "VER TODOS LOS JUEGOS →" y "INSERTAR MONEDA →" navegan a `/biblioteca`.
- [ ] La sección de actividad muestra 7 puntuaciones recientes y 5 filas de top; "VER SALÓN →" navega a `/salon`.
- [ ] "EMPEZAR GRATIS →" navega a `/auth`.
- [ ] `/biblioteca` muestra las 8 tarjetas, el buscador y los chips con el comportamiento de la SPEC 01.
- [ ] El nav muestra Inicio, Biblioteca y Salón de la Fama (y no "Acerca de"), en la barra y en el panel móvil.
- [ ] Inicio tiene la clase `active` en `/`; Biblioteca en `/biblioteca` y `/juegos/*`.
- [ ] El logo navega a `/`.
- [ ] Todos los "VOLVER AL VAULT" y el botón de la 404 navegan a `/biblioteca`.
- [ ] Iniciar sesión o entrar como invitado en `/auth` navega a `/biblioteca`.
- [ ] Las secciones aparecen con animación al hacer scroll; con `prefers-reduced-motion` aparecen sin animar.
- [ ] A 375px de ancho no hay scroll horizontal en `/`.
- [ ] `app/globals.css` no contiene clases `.about*`, `.contact*` ni `.gp*`.
- [ ] No hay errores de hidratación en la consola del navegador.

## Decisiones

- **Sí:** Inicio en `/` y Biblioteca en `/biblioteca`. Fiel a la plantilla (Inicio / Biblioteca como pantallas distintas).
- **No:** Inicio en `/inicio` dejando la Biblioteca en `/`. La landing no sería la portada.
- **Sí:** entran todas las secciones de `home.jsx` (por qué, juegos, stats, actividad, precios/FAQ, CTA final). Decisión del usuario.
- **Sí:** datos de actividad, top del día y stats copiados como mock estático. Coherente con el MVP mock; sin vínculo con `seededScores`.
- **No:** derivar la actividad de `seededScores`/`GAMES`. Cambia valores y añade trabajo sin aportar al MVP.
- **Sí:** nav solo añade "Inicio". "Acerca de" queda para otra spec a petición del usuario.
- **Sí:** portar solo el CSS de la landing; el de about, contacto y gamepad no se trae hasta que exista su pantalla.
- **Sí:** la landing es Server Component; solo `Reveal` es client. Menos JS en cliente.
- **No:** `onClick` con router en los botones de la plantilla. Se usan `Link` (prefetch, semántica de enlace).
- **Sí:** copiar "12+ JUEGOS" aunque hoy hay 8. Es contenido de marca de la plantilla; revisar si deja de ser coherente.
- **Sí:** respetar `prefers-reduced-motion` en `.reveal`. Mejora sobre la plantilla, de bajo coste.

## Riesgos

| Riesgo                                                                                          | Mitigación                                                                                          |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Enlaces a `/` que debían ir a la Biblioteca quedan sin actualizar                               | Paso 3 lista los archivos conocidos; verificar con `grep` de `href="/"` y `push("/")`.              |
| Contenido `.reveal` invisible (`opacity: 0`) si falla JS o el observer                          | `Reveal` muestra el contenido de inmediato sin `IntersectionObserver`; probar con JS deshabilitado. |
| Error de hidratación por la clase añadida en cliente                                            | La clase `.in` se añade solo en un efecto, tras hidratar.                                           |
| Copiar CSS en bloque arrastra reglas de about/gamepad                                           | El paso 1 delimita los bloques; criterio de aceptación comprueba su ausencia.                       |
| Solapamiento de nombres de clase con `globals.css` existente (`.top-row`, `.stat-*`, `.kicker`) | Revisar duplicados antes de pegar y consolidar si hay colisión.                                     |

## Lo que **no** entra en esta spec

- Página "Acerca de" y su navegación.
- Datos reales o en vivo en la landing.
- Cualquier cambio en juegos, sesión, créditos o leaderboards.

Cada uno, si llega, va en su propia spec.
