# SPEC 07 — Juego TETRIS en la plataforma

> **Estado:** Implementado
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-11-02
> **Objetivo:** Añadir el juego `tetris` al catálogo, portado desde `references/03-tetris` a un canvas jugable en `/juegos/tetris/jugar`, con su leaderboard en Supabase.

## Por qué existe esta spec

`references/03-tetris` es un Tetris jugable en canvas puro (`game.js`, sin dependencias). Usa un tablero de 10×20, ocho piezas (las siete estándar más una "tuerca" hueca de 3×3), pieza fantasma, vista de la siguiente pieza y niveles que aceleran la caída. Esta spec lo convierte en el segundo juego real de Arcade Vault, como una entrada **nueva** del catálogo, distinta del mock `caida`, que no cambia.

Es el primer juego sin vidas y con controles distintos de `asteroides`. Por eso amplía el registro de motores con metadatos por juego: si muestra vidas y su texto de controles. El cambio es mínimo y compatible con `asteroides`.

## Alcance

**Entra:**

- Fila nueva en `games`, añadida por migración, sin puntuaciones iniciales:
  - `id: "tetris"`, `title: "TETRIS"`, `cat: "PUZZLE"`, `color: "cyan"`, `cover: "cover-tetris"`, `sort_order: 10`.
  - `short` y `long` que describen solo mecánicas reales (ver Modelo de datos).
- Portada `.cover-tetris` en `app/globals.css`, en CSS puro y sin imágenes, distinta de `.cover-tetro` (la de `caida`).
- Ampliación del registro de motores:
  - `ENGINES` pasa de `CreateEngine` a `EngineEntry` (`{ create, controls, lives }`).
  - `GamePlayer` oculta el indicador "Vidas" si `lives` es `false`.
  - `GamePlayer` toma de `controls` el texto del aviso "REQUIERE TECLADO".
  - `asteroides` se registra con `lives: true` y su texto actual, y se ve igual que hoy.
- Motor en `lib/engines/tetris/`, registrado en `ENGINES`, que cumple `CreateEngine`:
  - Mecánicas, iguales a `game.js`:
    - Tablero de 10×20 celdas de 30 px y 8 piezas sorteadas con probabilidad uniforme: I, O, T, S, Z, J, L y la tuerca N.
    - Aparición en `x = floor(10 / 2) - floor(ancho / 2)`, `y = 0`. Si la pieza nueva colisiona al aparecer, la partida termina.
    - Rotación horaria (transponer e invertir), con kicks horizontales `[0, -1, 1, -2, 2]`.
    - Pieza fantasma con `globalAlpha` 0,2.
    - Caída automática con `dropInterval = max(100, 1000 - (level - 1) * 90)` ms. Al cumplirse, `dropAccum` vuelve a 0.
    - Las líneas completas se eliminan de abajo arriba y se añade una fila vacía arriba por cada una.
    - `level = floor(lines / 10) + 1`.
  - Puntuación:
    - Por líneas: `LINE_SCORES = [0, 100, 300, 500, 800]` × nivel, con el nivel que había antes de recalcularlo.
    - Soft drop: +1 por fila.
    - Hard drop: +2 por celda recorrida.
    - Tope de 10.000.000.
  - Controles:
    - `←` `→` mueven.
    - `↑` o `X` rotan.
    - `↓` es soft drop: si la pieza no puede bajar, se fija.
    - `Espacio` es hard drop.
    - Mantener una tecla la repite, también `Espacio`, como en el prototipo (`keydown` con autorrepetición del sistema).
    - La tecla P no la gestiona el motor.
  - Aspecto: el tema oscuro del prototipo, con sus colores, bloques con brillo superior, cuadrícula y fantasma. No hay selector de tema claro/oscuro.
  - HUD del juego **tal cual está en el prototipo**, dibujado en el canvas de 800×600:
    - Tablero de 300×600 centrado.
    - A la derecha del tablero, el panel lateral de `index.html` sin cambios de contenido, orden, textos ni estilo:
      - `SCORE`, `LINES` y `LEVEL`, con sus valores.
      - `NEXT`, con la vista de la siguiente pieza.
      - `CONTROLS`, con las teclas en cajas `kbd`: `← →` mover, `↑` rotar, `↓` bajar, `Space` caída y `P` pausa.
    - A la izquierda, el título `TETRIS`, que en el prototipo está encima del tablero.
    - Al terminar la partida, overlay "GAME OVER" con "Puntuación: N", sin botón de reinicio.
  - HUD principal de React, adaptado al juego: muestra Jugador, Puntuación y Nivel, y oculta Vidas. Los valores coinciden con los del canvas.
- Notificaciones a React: `onStats` solo cuando cambian los valores y `onGameOver` al terminar la partida.
- Leaderboard real sin código propio: el guardado usa `submitScore`, y el detalle y el Salón leen la vista `leaderboard`.

**Fuera de alcance:**

- Tema claro/oscuro del prototipo y su clave `tetris-theme` en `localStorage`.
- Overlay "PAUSA" y botón "Reiniciar" del prototipo: los sustituyen la pausa y el modal de la plataforma.
- Mecánicas que no están en el prototipo: hold, bolsa de 7, lock delay, SRS completo, T-spin, combos o modo maratón.
- Repetición de teclas propia del motor (DAS/ARR): se usa la del sistema.
- Controles táctiles, sonido y pantalla completa.
- Cambios en `caida`, en los demás juegos mock y en la jugabilidad de `asteroides`.
- Mostrar `tetris` en la página de inicio, que solo lista los 6 primeros por `sort_order`.
- Antitrampas, Realtime y Auth.
- Tests automatizados.

## Modelo de datos

Sin cambios de esquema. Fila nueva en `games`:

```sql
insert into public.games (id, title, short, long, cat, cover, color, sort_order) values (
  'tetris',
  'TETRIS',
  'Encaja ocho piezas y limpia líneas sin parar.',
  'Siete piezas clásicas y una tuerca hueca caen en un tablero de 10×20. Muévelas y rótalas con las flechas y suéltalas con Espacio: la sombra marca dónde aterrizan. Cada línea completa suma puntos multiplicados por el nivel, y cada 10 líneas la caída se acelera.',
  'PUZZLE', 'cover-tetris', 'cyan', 10
);
```

Puntuación: `LINE_SCORES[n] × level` por líneas, +1 por fila de soft drop y +2 por celda de hard drop. Cada suma pasa por `Math.min(score + puntos, 10_000_000)`. Todas las sumas son enteras: no hace falta `Math.floor`. El juego no se puede ganar.

Valores de `GameStats`: `score` = puntuación, `lives` = `0` (el juego no tiene vidas y React no las muestra), `level` = nivel. `lines` solo se muestra en el canvas y no se notifica.

Registro ampliado (`lib/engines/types.ts` y `lib/engines/index.ts`):

```ts
export interface EngineEntry {
  create: CreateEngine;
  controls: string; // texto del aviso "REQUIERE TECLADO", tras "Conecta uno para jugar:"
  lives: boolean; // false: GamePlayer oculta el indicador "Vidas"
}

export const ENGINES: Partial<Record<string, EngineEntry>> = {
  asteroides: {
    create: createAsteroidesGame,
    controls: "flechas para rotar y propulsar, Espacio para disparar.",
    lives: true,
  },
  tetris: {
    create: createTetrisGame,
    controls: "flechas ← → para mover y ↓ para bajar, ↑ o X para rotar, Espacio para soltar.",
    lives: false,
  },
};
```

El comentario de `restart()` en `GameEngine` pasa a "partida nueva con el estado inicial del juego", porque Tetris no empieza con 3 vidas.

Estado interno del motor (privado, en el cierre de `createTetrisGame`): `board`, `current`, `next`, `score`, `lines`, `level`, `dropInterval`, `dropAccum`, `state: "playing" | "gameover"`, `paused` e `inputEnabled`.

Disposición del canvas (coordenadas lógicas de 800×600):

| Zona            | Rectángulo         | Contenido                                                                                                                           |
| --------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Panel izquierdo | x 0–250            | Título `TETRIS`: Courier bold de 36 px, `#7aa2f7`, espaciado de 10 px y brillo `rgba(122,162,247,0.5)`                              |
| Tablero         | x 250–550, y 0–600 | Fondo `#1a1a25`, borde `#2a2a3a` y cuadrícula `#22222e` de 0,5 px                                                                   |
| Panel derecho   | x 570–730          | Panel del prototipo (160 px de ancho, 20 px tras el tablero, 20 px entre secciones): `SCORE`, `LINES`, `LEVEL`, `NEXT` y `CONTROLS` |

Estilos del panel, copiados de `style.css` (tema oscuro):

- Fondo general `#0f0f17`.
- Etiquetas: 10 px, peso 600, espaciado de 2 px y `#555570`.
- Valores: Courier bold de 26 px, espaciado de 1 px y `#7aa2f7`.
- Caja `NEXT` de 120×120, con fondo `#1a1a25`, borde `#2a2a3a` y bloques de 30 px centrados.
- Controles: texto de 12 px en `#888`. Teclas en cajas con fondo `#22223a`, borde `#3a3a5a` y texto de 11 px en `#aaa`.
- Las cajas `kbd` muestran `← →` (dos cajas), `↑`, `↓`, `Space` y `P`, como en `index.html`. La lista no se cambia aunque `X` también rote y la pausa sea de React.
- Puntuación del panel con `toLocaleString("es-ES")`, igual que el HUD de React, para que los dos muestren el mismo número con el mismo formato.

Archivos nuevos:

```
supabase/migrations/<timestamp>_add_tetris.sql
lib/engines/tetris/board.ts   // constantes, PIECES, COLORS, createBoard, collide, rotateCW, clearLines, randomPiece
lib/engines/tetris/game.ts    // createTetrisGame: estado, input, bucle, draw, HUD y overlay
```

Archivos modificados:

```
lib/engines/types.ts         // EngineEntry y comentario de restart()
lib/engines/index.ts         // registro con metadatos; asteroides y tetris
components/game-player.tsx   // lee create/controls/lives de la entrada; oculta "Vidas"
app/globals.css              // .cover-tetris
```

## Plan de implementación

1. Crear la migración con `npx supabase migration new add_tetris` y aplicarla con `npx supabase db push --linked`. Comprobar que `/juegos/tetris` carga. La fila puede requerir reconstruir o reiniciar, porque el catálogo está cacheado con el tag `games`. No hace falta `npm run db:types`, porque el esquema no cambia.
2. Crear `.cover-tetris` en `app/globals.css` con `/frontend-design`, con valores en % y respetando el lenguaje visual CRT. Debe distinguirse de `.cover-tetro`, por ejemplo con la tuerca como motivo.
3. Ampliar el registro:
   - Añadir `EngineEntry` en `lib/engines/types.ts` y ajustar el comentario de `restart()`.
   - Convertir la entrada de `asteroides` en `lib/engines/index.ts`.
   - En `components/game-player.tsx`, leer `ENGINES[game.id]` como entrada y pasar `entry.create` a `GameCanvas`. Pintar el aviso con `entry.controls` y ocultar el `hud-stat` de Vidas si `entry.lives` es `false`.
   - Los juegos mock, sin entrada, siguen mostrando Vidas.
   - Comprobar que `/juegos/asteroides/jugar` se ve y funciona igual que antes.
4. Crear `lib/engines/tetris/board.ts` con la lógica pura del prototipo:
   - Mismas constantes, piezas y colores, con tipos estrictos.
   - Funciones que reciben el tablero como parámetro: sin estado en variables de módulo y sin `document` ni `window`.
5. Crear `createTetrisGame: CreateEngine` en `lib/engines/tetris/game.ts`, siguiendo `lib/engines/asteroides/game.ts`:
   - Estado en un cierre.
   - `keydown` en `window`, que actúa directamente en cada evento (incluidos los repetidos) y retira su listener en `destroy()`.
   - Bucle con `dt` limitado a 50 ms y `lastTime = null` al reanudar.
   - `draw` con `setTransform(canvas.width / 800, …)`, paneles, tablero, fantasma, pieza actual y overlay.
   - `notify` al final de cada frame y de cada tecla procesada.
   - `pause`, `resume`, `restart`, `end`, `setInputEnabled` y `destroy`.
   - Registrar `tetris` en `ENGINES` con `lives: false` y su texto de controles.
6. Ejecutar `npm run lint` y `npm run build`, y probar a mano el flujo completo en `/juegos/tetris/jugar`.

Antes de escribir código específico de Next o React, leer la guía correspondiente en `node_modules/next/dist/docs/`.

## Criterios de aceptación

Específicos del juego:

- [ ] Durante una partida aparecen las 8 piezas con sus colores del prototipo, incluida la tuerca gris con hueco central.
- [ ] `←` y `→` mueven la pieza una columna y no la dejan salir del tablero ni solaparse con bloques fijados.
- [ ] `↑` y `X` rotan en sentido horario. Pegada a la pared, la pieza rota desplazándose hasta 2 columnas si hay hueco.
- [ ] `↓` baja la pieza una fila y suma 1 punto. Si no puede bajar, la pieza se fija.
- [ ] `Espacio` deja caer la pieza hasta la posición del fantasma y suma 2 puntos por celda recorrida.
- [ ] Mantener `←` desplaza la pieza de forma continua, y mantener `Espacio` encadena caídas.
- [ ] Limpiar 1, 2, 3 o 4 líneas a la vez suma 100, 300, 500 u 800 puntos multiplicados por el nivel.
- [ ] Cada 10 líneas sube el nivel, y la caída automática se acelera según `max(100, 1000 - (nivel - 1) × 90)` ms.
- [ ] El fantasma se dibuja translúcido en la posición donde aterrizará la pieza.
- [ ] La caja `NEXT` muestra la pieza que aparece a continuación.
- [ ] El canvas muestra el tablero centrado y, a su derecha, el panel del prototipo en el mismo orden y con los mismos textos y colores: `SCORE`, `LINES`, `LEVEL`, `NEXT` y `CONTROLS` (`← →` mover, `↑` rotar, `↓` bajar, `Space` caída, `P` pausa).
- [ ] El título `TETRIS` aparece a la izquierda del tablero con el color y el brillo del prototipo.
- [ ] `SCORE` y `LEVEL` del canvas muestran el mismo valor que Puntuación y Nivel del HUD de React, y `LINES` cuenta las líneas limpiadas.
- [ ] Si una pieza nueva no cabe al aparecer, el canvas muestra "GAME OVER" y "Puntuación: N", y las teclas ya no mueven nada.
- [ ] El motor no registra la tecla P ni Escape. Toda suma de puntos pasa por el tope de 10.000.000 (revisión de código).
- [ ] El HUD de React en `/juegos/tetris/jugar` no muestra "Vidas"; en `/juegos/asteroides/jugar` y en los juegos mock sí.
- [ ] El aviso "REQUIERE TECLADO" de Tetris describe sus controles, y el de `asteroides` conserva su texto actual.

Integración con la plataforma:

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `npx supabase db push --linked` no tiene cambios pendientes.
- [ ] `TETRIS` aparece en `/biblioteca` con su portada, en su filtro de categoría y en las pestañas del Salón.
- [ ] `/juegos/tetris` muestra "Partidas" 0, "Mejor global" 0 y "SIN PUNTUACIONES TODAVÍA" antes de la primera partida guardada.
- [ ] `/juegos/tetris/jugar` muestra el canvas jugable dentro del CRT.
- [ ] El HUD de React muestra los mismos valores que el motor, y `onStats` no se llama en frames sin cambios.
- [ ] Al terminar la partida se abre "FIN DEL JUEGO" con la puntuación final.
- [ ] Guardar crea una fila en `scores` con `game_id = 'tetris'`, y detalle y Salón la muestran sin reiniciar el servidor.
- [ ] PAUSA y tecla P congelan y reanudan el juego sin saltos, y cambiar de pestaña lo pausa.
- [ ] FIN abre el modal con la puntuación actual, y JUGAR DE NUEVO empieza una partida limpia.
- [ ] Con el modal abierto, las teclas no afectan al juego y se puede escribir en el input de iniciales.
- [ ] Las teclas del juego no hacen scroll mientras se juega; tras SALIR no queda ningún bucle ni listener.
- [ ] Dos montajes seguidos no comparten estado.
- [ ] El canvas mantiene la proporción y no se ve borroso con `devicePixelRatio` 2; a 375px no hay scroll horizontal.
- [ ] `asteroides` y los juegos mock siguen funcionando igual.
- [ ] No hay errores de hidratación ni de consola en `/juegos/tetris` ni en `/juegos/tetris/jugar`.

## Decisiones

- **Sí:** entrada nueva `tetris`, sin puntuaciones. Decisión del usuario; su ranking solo contiene partidas reales.
- **No:** reutilizar el mock `caida`. Heredaría 12 puntuaciones falsas. `caida` queda como mock sin cambios.
- **Sí:** las 8 piezas de `game.js`, incluida la tuerca. Decisión del usuario; manda el código, aunque el README hable de 7.
- **Sí:** tema oscuro fiel al prototipo. Decisión del usuario.
- **No:** selector claro/oscuro ni `localStorage`. No encaja en el CRT y exigiría UI fuera del canvas.
- **No:** paleta neón. Se descarta para conservar el juego tal cual.
- **Sí:** canvas de 800×600 con el tablero centrado. Decisión del usuario.
- **Sí:** el HUD del juego (panel `SCORE`, `LINES`, `LEVEL`, `NEXT` y `CONTROLS`) se conserva tal cual, dentro del canvas y a la derecha del tablero. Decisión del usuario; se descarta mover los controles a un panel izquierdo. A la izquierda solo va el título.
- **Sí:** las adaptaciones se hacen en el HUD principal de React: se oculta Vidas y se mantienen Puntuación y Nivel, alimentados por `onStats`. Decisión del usuario.
- **No:** añadir Líneas o la siguiente pieza al HUD de React. Ya están en el HUD del juego.
- **Sí:** el panel formatea la puntuación con `es-ES` en lugar del `toLocaleString()` sin locale del prototipo. Es el único cambio sobre el HUD original, y evita que canvas y React muestren separadores distintos.
- **Sí:** ficha con `PUZZLE`, `cyan`, `cover-tetris`, `sort_order` 10 y los textos propuestos. Decisión del usuario; cyan se acerca al azul del prototipo y se distingue de `caida` (magenta).
- **Sí:** registro con metadatos (`EngineEntry` con `controls` y `lives`). Decisión del usuario. Es el cambio mínimo para ocultar Vidas y corregir el texto de controles, y es compatible con `asteroides`.
- **No:** mostrar "Vidas: —" con `lives: 0`. Muestra un dato que el juego no tiene y deja un destello de ♥♥♥ al montar.
- **Sí:** `lives: 0` en `GameStats`. El contrato exige el campo; React no lo muestra para Tetris.
- **Sí:** tope de 10.000.000 en el motor. Decisión del usuario; por encima, `submitScore` rechazaría el guardado.
- **Sí:** autorrepetición del sistema en todas las teclas, también `Espacio`. Decisión del usuario; es fiel al prototipo. Por eso no se copia el `justPressed` de `asteroides`.
- **Sí:** el overlay de fin se dibuja en el canvas, sin botón, y el reinicio solo llega por JUGAR DE NUEVO. El modal de la plataforma sustituye el botón "Reiniciar" del prototipo. El `backdrop-filter` no existe en canvas y se reemplaza por un velo `rgba(10,10,20,0.75)`.
- **Sí:** tras el fin de partida se dibuja el tablero sin pieza actual ni fantasma. El prototipo dejaba de dibujar en ese frame, y la pieza nueva solapada no aporta nada.
- **Sí:** `preventDefault` en flechas y `Espacio`. El prototipo solo lo hacía en `Espacio`, y en la plataforma las flechas harían scroll.
- **Sí:** `notify()` también tras cada tecla. Un hard drop puede terminar la partida dentro del `keydown`, y así `onGameOver` llega en el mismo evento.

## Riesgos

| Riesgo                                                                                                  | Mitigación                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Copiar el `justPressed` de `asteroides` rompe la autorrepetición de las flechas                         | El `keydown` actúa en cada evento, incluidos los repetidos; hay un criterio de aceptación para mantener `←` y `Espacio`.                                                    |
| El motor también gestiona P y la pausa queda duplicada                                                  | El motor no registra P ni Escape; la pausa es de React.                                                                                                                     |
| Una tecla repetida llega mientras el modal está abierto o en pausa                                      | Todo el `keydown` respeta `inputEnabled && !paused && state === "playing"`. React bloquea el input en el mismo `onGameOver`.                                                |
| `canvas.width` incluye `devicePixelRatio` y descoloca paneles y tablero                                 | Se dibuja en coordenadas lógicas de 800×600 con `setTransform`; el prototipo usaba `canvas.width` directamente.                                                             |
| `getComputedStyle(document.body)` del prototipo para la cuadrícula falla en servidor o depende del tema | El color de la cuadrícula es la constante `#22222e`; nada de `document` ni `window` a nivel de módulo.                                                                      |
| Salto de caída al reanudar o con la pestaña en segundo plano                                            | `dt` limitado a 50 ms y `lastTime = null` al reanudar. Como `dropInterval` ≥ 100 ms, no se pierden caídas.                                                                  |
| Cambiar `ENGINES` rompe `asteroides`                                                                    | El paso 3 mantiene su texto y `lives: true`, y se comprueba antes de crear el motor de Tetris.                                                                              |
| `/juegos/tetris` da 404 en una app ya levantada                                                         | El catálogo está cacheado con el tag `games`; reconstruir o reiniciar tras aplicar la migración. `npm run build` consulta Supabase: aplicar la migración antes de compilar. |
| `cover-tetris` mal escrita deja la portada vacía sin error                                              | Comprobar la portada en `/biblioteca` y en el detalle.                                                                                                                      |
| A 375 px los textos del canvas quedan muy pequeños                                                      | Se acepta: el juego requiere teclado y el aviso lo indica.                                                                                                                  |

## Lo que **no** entra en esta spec

- Tema claro/oscuro del prototipo.
- Hold, bolsa de 7, lock delay, SRS, T-spin y combos.
- DAS/ARR propios del motor.
- Controles táctiles, sonido y pantalla completa.
- Cambios en `caida`, en los demás mocks y en la jugabilidad de `asteroides`.
- Mostrar `tetris` en la página de inicio.
- Antitrampas, Realtime y Auth.

Cada uno, si llega, va en su propia spec.
