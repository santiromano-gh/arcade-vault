# SPEC 08 — Juego REBOTE NEÓN en la plataforma

> **Estado:** Implementado
> **Depende de:** SPEC 05, SPEC 06, SPEC 07
> **Fecha:** 2026-11-06
> **Objetivo:** Añadir el juego `rebote-neon` al catálogo, un rompebloques portado desde `references/04-arkanoid` a un canvas jugable en `/juegos/rebote-neon/jugar`, con skins y con su leaderboard en Supabase.

## Por qué existe esta spec

`references/04-arkanoid` es un rompebloques jugable en JS puro (`game.js`, `levels.js` y un spritesheet). Tiene una paleta controlada con ratón o flechas, una pelota, 5 muros de bloques con patrones distintos, 3 vidas, 10 puntos por bloque, explosiones de 4 frames y dos sonidos. Esta spec lo convierte en el tercer juego real de Arcade Vault, con nombre, aspecto y giro propios: **REBOTE NEÓN**. Lo había sugerido `game-planner` (`references/game-suggestions-todo.md`).

Cambia el prototipo en cuatro puntos, todos para que el juego sirva para competir:

- El ángulo de rebote depende del punto de la paleta donde golpea la pelota.
- La pelota se lanza a mano.
- Los niveles se repiten sin fin y cada vuelta es más rápida.
- La puntuación se multiplica por el nivel y por el **voltaje**, una racha de bloques rotos sin tocar la paleta.

Cabe en 800×600 con `score`, `lives` y `level`, así que **no amplía la plataforma**. Es el primer motor que nace con skins (CLÁSICO, NEÓN y RETRO) y el primero que usa el ratón y audio.

## Alcance

**Entra:**

- Fila nueva en `games`, añadida por migración, sin puntuaciones iniciales:
  - `id: "rebote-neon"`, `title: "REBOTE NEÓN"`, `cat: "ARCADE"`, `color: "green"`, `cover: "cover-rebote-neon"`, `sort_order: 3`.
  - `short` y `long` que describen solo mecánicas reales (ver Modelo de datos).
- Portada `.cover-rebote-neon` en `app/globals.css`, en CSS puro y sin imágenes.
- Motor en `lib/engines/rebote-neon/`, registrado en `ENGINES` con `lives: true` y `skins: true`, que cumple `CreateEngine`:
  - Mecánicas:
    - Base del prototipo: paleta de 81×14 en `y = 560`, pelota de 16×16, bloques de 64×24 en una rejilla de 10×6 con origen en (80, 80), y los 5 patrones de `levels.js` con sus colores.
    - Cambios acordados: ángulo de rebote, lanzamiento manual, rebote en bloques según la cara, ciclo infinito de niveles, tope de velocidad y voltaje.
  - Controles:
    - El ratón sobre el canvas mueve la paleta.
    - `←` y `→` la mueven a 400 px/s.
    - `Espacio` o clic en el canvas lanzan la pelota.
    - El motor no gestiona P ni Escape.
  - Aspecto: dibujo vectorial en canvas (sin spritesheet), con las skins CLÁSICO, NEÓN y RETRO desde el primer día. CLÁSICO reproduce los colores que se ven en el spritesheet del prototipo.
  - HUD y overlays en el canvas:
    - Indicador `VOLTAJE ×N`.
    - Aviso de saque `NIVEL N` / `ESPACIO O CLIC PARA LANZAR`.
    - Overlay `GAME OVER`.
    - Puntuación, Vidas y Nivel solo se muestran en el HUD de React.
  - Audio: los dos MP3 del prototipo (rebote y rotura de bloque).
- Notificaciones a React: `onStats` solo cuando cambian los valores y `onGameOver` al terminar la partida.
- Leaderboard real sin código propio: el guardado usa `submitScore`, y el detalle y el Salón leen la vista `leaderboard`.
- Fila de `rebote-neon` en `references/game-with-themes.md`, con el contraste calculado de cada skin.

**Fuera de alcance:**

- Spritesheet del prototipo y su PNG.
- Selector de nivel dentro de la pausa, overlay `PAUSA` y estado de victoria del prototipo.
- Power-ups, bloques resistentes o indestructibles, multibola, láser, enemigos y bloques conductores en cadena.
- Controles táctiles, silenciar el audio desde la UI y pantalla completa.
- Cambios en `asteroides`, `tetris` y en la plataforma (`game-player`, `types.ts`, HUD).
- Antitrampas, Realtime y Auth.
- Tests automatizados.

## Modelo de datos

Sin cambios de esquema. Fila nueva en `games`:

```sql
insert into public.games (id, title, short, long, cat, cover, color, sort_order) values (
  'rebote-neon',
  'REBOTE NEÓN',
  'Rompe muros de bloques y encadena voltaje.',
  'Mueve la paleta con el ratón o las flechas y lanza la pelota con Espacio o clic: el ángulo del rebote depende de dónde golpea en la paleta. Cada bloque que rompes sin volver a tocarla sube el voltaje hasta ×5 y multiplica sus puntos junto al nivel. Cinco muros se repiten cada vez más rápido y tienes 3 vidas.',
  'ARCADE', 'cover-rebote-neon', 'green', 3
);
```

`sort_order` 3 es el mayor existente (`tetris` = 2, tras `20261105203829_remove_mock_games.sql`) más uno, así que el juego aparece también en la página de inicio. `ARCADE` ya existe en el enum `game_category`: no hace falta `ALTER TYPE`.

Puntuación:

- Cada bloque roto suma `10 × level × voltage`.
- `voltage` es el número de bloques rotos desde el último toque de la paleta, incluido el actual, con un tope de 5: el primero vale ×1, el segundo ×2 y del quinto en adelante ×5.
- El voltaje vuelve a ×1 al tocar la paleta, al perder una vida y al empezar un nivel.
- Cada suma pasa por `Math.min(score + puntos, 10_000_000)`. Todas las sumas son enteras: no hace falta `Math.floor`.
- El juego no se puede ganar.

Valores de `GameStats`:

- `score`: la puntuación.
- `lives`: las vidas restantes (empieza en 3).
- `level`: el contador absoluto de niveles (1, 2, … 6, 7…).

Niveles y velocidad:

- El patrón del nivel `n` es `LEVELS[(n - 1) % 5]`.
- Multiplicador de velocidad: `Math.min(1.1 ** (n - 1), 2.0)`, que llega al tope en el nivel 9.
- Velocidad base: el módulo de `(200, -300)` del prototipo, ≈ 360,6 px/s. La pelota mantiene ese módulo × multiplicador en todos sus rebotes.

Física:

- **Lanzamiento.** Mientras la pelota espera (estado `serve`), sigue pegada al centro de la paleta. `Espacio` o clic la lanzan con la dirección del prototipo, `(200, -300)` normalizada y escalada a la velocidad del nivel.
- **Paleta.** Al tocarla (solo si `vy > 0`), `t = clamp((centroPelota - centroPaleta) / (paddle.w / 2), -1, 1)` y el ángulo respecto a la vertical es `t × 60°`. Queda `vx = v · sin(θ)` y `vy = -v · cos(θ)`, y la pelota se recoloca encima de la paleta.
- **Paredes.** Izquierda, derecha y techo invierten la componente correspondiente y recolocan la pelota dentro del campo, como el prototipo.
- **Bloques.** Como máximo uno por frame, como el prototipo. Se invierte el eje con menor solapamiento: `vx` si el golpe es lateral y `vy` si es superior o inferior.
- **Subpasos.** El movimiento de cada frame se divide en subpasos de ≤ 8 px. A ×2,0 la pelota recorre unos 36 px por frame con `dt` = 50 ms y atravesaría bloques de 24 px.
- **Pelota perdida.** Al salir por abajo se pierde una vida. Si quedan vidas, la pelota vuelve a `serve`; con 0 vidas, `gameover`.
- **Nivel vacío.** Al no quedar bloques vivos, `level + 1`, se carga el patrón siguiente, se vacían las explosiones y la pelota vuelve a `serve`.

Estado interno del motor (privado, en el cierre de `createReboteNeonGame`):

- Entidades: `paddle`, `ball` y `blocks`.
- Explosiones: `explosions` (`{ x, y, w, h, color, elapsed }`).
- Partida: `score`, `lives`, `level`, `voltage` y `state: "serve" | "playing" | "gameover"`.
- Control: `paused`, `inputEnabled`, `keys` y `palette`.

Bloques. Cada bloque guarda su color lógico del prototipo: `gray`, `red`, `yellow`, `cyan`, `magenta`, `hotpink` o `green`. La paleta de cada skin traduce ese color a un tono.

Explosión. Dura 150 ms en 4 pasos. En el paso `k` (0–3) se dibuja el rectángulo del bloque, centrado, con escala `1 + 0,15k` y opacidad `1 - k/4`.

Skins (`lib/engines/rebote-neon/skins.ts`):

- Tipo `ReboteNeonPalette` con todos los colores del dibujo:
  - fondo;
  - los 7 colores de bloque;
  - borde y brillo superior del bloque;
  - paleta y sus extremos;
  - pelota;
  - textos del canvas (voltaje, aviso de saque, GAME OVER) y velo de los overlays;
  - `glow` y multiplicador de grosor.
- `export const SKINS: Record<SkinId, ReboteNeonPalette>`.
- **CLÁSICO.** Los colores que se ven en `references/04-arkanoid/assets/spritesheet-breakout.png`, no los nombres de `spritesheet.js`, que no coinciden con el dibujo:

  | Color lógico | Tono visible | Hex       |
  | ------------ | ------------ | --------- |
  | `red`        | rojo         | `#c83c46` |
  | `cyan`       | verde agua   | `#3cc39b` |
  | `green`      | azul         | `#3c91e1` |
  | `magenta`    | violeta      | `#6e46d2` |
  | `yellow`     | dorado       | `#e6b446` |
  | `hotpink`    | naranja      | `#f0821e` |
  | `gray`       | gris piedra  | `#6e6e78` |
  - Fondo `#000`.
  - Paleta plateada `#d2d2dc` con extremos rojos `#dc3c46`.
  - Pelota `#c8c8d2`.
  - Textos `#fff`, como el prototipo.
  - Sin resplandor.

- **NEÓN.** Tokens de la plataforma (`#00f5ff`, `#ff006e`, `#f5ff00`, `#00ff88`) y tonos afines sobre `#0a0a0f`, con resplandor de 6 a 16.
- **RETRO.** Paleta limitada (fósforo u 8-bit) sin resplandor. Los colores de bloque se distinguen también por luminosidad o patrón.
- Contraste WCAG sobre fondo oscuro:
  - fondo con luminancia ≤ `--bg-3`;
  - textos del canvas ≥ 4,5:1;
  - bloques, paleta y pelota ≥ 3:1.
- El contraste se registra en `references/game-with-themes.md`. Si CLÁSICO no cumple por ser fiel al original (por ejemplo, el violeta o el gris), se marca ⚠️ con el detalle, como `tetris`.

Registro (`lib/engines/index.ts`):

```ts
"rebote-neon": {
  load: () => import("./rebote-neon/game").then((m) => m.createReboteNeonGame),
  controls: "ratón o flechas ← → para mover la paleta, Espacio o clic para lanzar.",
  lives: true,
  skins: true,
},
```

Archivos nuevos:

```
supabase/migrations/<timestamp>_add_rebote_neon.sql
lib/engines/rebote-neon/levels.ts   // constantes, BlockColor y LEVELS (los 5 patrones de levels.js)
lib/engines/rebote-neon/skins.ts    // ReboteNeonPalette y SKINS
lib/engines/rebote-neon/game.ts     // createReboteNeonGame: estado, input, física, audio, draw y overlays
public/games/rebote-neon/ball-bounce.mp3
public/games/rebote-neon/break-sound.mp3
```

Archivos modificados:

```
lib/engines/index.ts                // registro de rebote-neon
app/globals.css                     // .cover-rebote-neon
references/game-with-themes.md      // fila de rebote-neon
```

## Plan de implementación

1. Crear la migración con `npx supabase migration new add_rebote_neon` y aplicarla con `npx supabase db push --linked`. Comprobar que `/juegos/rebote-neon` carga. La fila puede requerir reconstruir o reiniciar, porque el catálogo está cacheado con el tag `games`. No hace falta `npm run db:types`, porque el esquema no cambia.
2. Crear `.cover-rebote-neon` en `app/globals.css` con `/frontend-design`, con valores en % y respetando el lenguaje visual CRT. Motivo sugerido: muro de bloques, paleta y pelota con estela, en verde.
3. Copiar los MP3 de `references/04-arkanoid/assets/sounds/` a `public/games/rebote-neon/`.
4. Crear `lib/engines/rebote-neon/levels.ts`:
   - Constantes del prototipo con tipos estrictos.
   - `BlockColor`.
   - `LEVELS` con los 5 patrones de `levels.js` y sus colores, sin el campo `speed`: la velocidad sale de la fórmula.
   - Sin estado de módulo ni `document` ni `window`.
5. Crear `lib/engines/rebote-neon/skins.ts` con `ReboteNeonPalette` y las tres skins, y calcular su contraste WCAG.
6. Crear `createReboteNeonGame: CreateEngine` en `lib/engines/rebote-neon/game.ts`, siguiendo `lib/engines/asteroides/game.ts`:
   - Estado en un cierre.
   - Entrada:
     - `keydown` y `keyup` en `window` para `←`, `→` y `Espacio`, con `preventDefault`.
     - `mousemove` y `click` en el canvas, con la escala `W / rect.width` de las constantes lógicas (nunca `canvas.width`).
     - Toda la entrada se ignora si `!inputEnabled || paused || state === "gameover"`.
   - `new Audio("/games/rebote-neon/…")` dentro de la factoría. Reproducir con `cloneNode()` y `.play().catch(() => {})`.
   - Bucle con `dt` limitado a 50 ms, `lastTime = null` al reanudar y subpasos de ≤ 8 px.
   - `draw` con `setTransform(canvas.width / 800, …)`. Sin colores literales: todo sale de `palette`, y `shadowBlur = 0` tras cada trazo con resplandor.
   - `notify` al final de cada frame y tras cada evento de entrada que cambie el estado.
   - `pause`, `resume`, `restart`, `end`, `setInputEnabled`, `setSkin` y `destroy`.
     - `setSkin` cambia `palette` y, si el bucle está detenido, dibuja un frame.
     - `destroy` cancela el `requestAnimationFrame` y retira los listeners de `window` y del canvas.
   - Registrar `rebote-neon` en `ENGINES` con la entrada del Modelo de datos.
7. Añadir la fila de `rebote-neon` a `references/game-with-themes.md` con el estado y el peor contraste de cada skin.
8. Ejecutar `npm run lint` y `npm run build`, y probar a mano el flujo completo en `/juegos/rebote-neon/jugar` con las tres skins.

Antes de escribir código específico de Next o React, leer la guía correspondiente en `node_modules/next/dist/docs/`.

## Criterios de aceptación

Específicos del juego:

- [ ] Al empezar, el nivel 1 muestra la rejilla completa de 10×6 con los colores por fila del prototipo, y la pelota espera sobre la paleta con "NIVEL 1" y "ESPACIO O CLIC PARA LANZAR".
- [ ] Mientras espera, la pelota sigue a la paleta. `Espacio` o clic la lanzan hacia arriba y a la derecha.
- [ ] El ratón sobre el canvas mueve la paleta centrada en el cursor, también con el canvas escalado o con `devicePixelRatio` 2. `←` y `→` la mueven, y la paleta no sale del campo.
- [ ] Al golpear el centro de la paleta, la pelota sale casi vertical. Cerca de los extremos sale con un ángulo de hasta 60°, hacia el lado del extremo.
- [ ] La pelota rebota en las paredes laterales y en el techo, y su velocidad no cambia con ningún rebote.
- [ ] Un golpe lateral contra un bloque invierte la dirección horizontal, y uno superior o inferior invierte la vertical. Se rompe como máximo un bloque por frame.
- [ ] A ×2,0 (nivel 9 o superior) la pelota no atraviesa bloques ni la paleta.
- [ ] Romper bloques seguidos sin tocar la paleta muestra `VOLTAJE ×1`, `×2`… hasta `×5`. Tocar la paleta, perder una vida o empezar un nivel lo devuelve a ×1.
- [ ] Cada bloque suma `10 × nivel × voltaje`: en el nivel 1 con voltaje ×3, un bloque suma 30.
- [ ] El bloque roto se expande y desaparece en 150 ms, y suena la rotura. Los rebotes en paredes y paleta suenan.
- [ ] Al vaciar el nivel 5, el nivel 6 muestra la rejilla del nivel 1, la pelota vuelve a `serve` y va un 10 % más rápida que en el nivel 5 hasta el tope ×2,0.
- [ ] Perder la pelota resta una vida y la devuelve a la paleta. Con la última vida perdida, el canvas muestra `GAME OVER` y se abre "FIN DEL JUEGO".
- [ ] El HUD de React muestra Puntuación, Vidas (♥ ♥ ♥ al empezar) y Nivel. El canvas no dibuja Score, Nivel ni las bolas de vida del prototipo.
- [ ] El motor no registra P ni Escape, no tiene selector de nivel y toda suma de puntos pasa por el tope de 10.000.000 (revisión de código).
- [ ] El aviso "REQUIERE TECLADO" muestra los controles de la entrada del registro.
- [ ] Si el navegador bloquea el audio, el juego sigue sin errores en consola.

Skins:

- [ ] El selector muestra CLÁSICO, NEÓN y RETRO. Cambiar de skin redibuja al instante, también en pausa, sin reiniciar la partida ni cambiar puntuación, vidas, nivel o posiciones.
- [ ] CLÁSICO usa los tonos de la tabla del Modelo de datos sobre fondo negro, y la elección persiste al recargar (`av_skin_rebote-neon`).
- [ ] En las tres skins, los 7 colores de bloque se distinguen entre sí, y `references/game-with-themes.md` registra el contraste de cada una.
- [ ] El código de dibujo no contiene colores literales (revisión de código).

Integración con la plataforma:

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `npx supabase db push --linked` no tiene cambios pendientes.
- [ ] `REBOTE NEÓN` aparece en `/`, en `/biblioteca` con su portada, en el filtro `ARCADE` y en las pestañas del Salón.
- [ ] `/juegos/rebote-neon` muestra "Partidas" 0, "Mejor global" 0 y "SIN PUNTUACIONES TODAVÍA" antes de la primera partida guardada.
- [ ] `/juegos/rebote-neon/jugar` muestra el canvas jugable dentro del CRT.
- [ ] El HUD de React muestra los mismos valores que el motor, y `onStats` no se llama en frames sin cambios.
- [ ] Al terminar la partida se abre "FIN DEL JUEGO" con la puntuación final.
- [ ] Guardar crea una fila en `scores` con `game_id = 'rebote-neon'`, y detalle y Salón la muestran sin reiniciar el servidor.
- [ ] PAUSA y tecla P congelan y reanudan el juego sin saltos, y cambiar de pestaña lo pausa.
- [ ] FIN abre el modal con la puntuación actual, y JUGAR DE NUEVO empieza una partida limpia (nivel 1, 3 vidas, 0 puntos, voltaje ×1, pelota en `serve`).
- [ ] Con el modal abierto, las teclas, el ratón y el clic no afectan al juego, y se puede escribir en el input de iniciales.
- [ ] Las teclas del juego no hacen scroll mientras se juega; tras SALIR no queda ningún bucle, listener ni sonido pendiente.
- [ ] Dos montajes seguidos no comparten estado.
- [ ] El canvas mantiene la proporción y no se ve borroso con `devicePixelRatio` 2; a 375px no hay scroll horizontal.
- [ ] `asteroides`, `tetris` y sus skins siguen funcionando igual.
- [ ] No hay errores de hidratación ni de consola en `/juegos/rebote-neon` ni en `/juegos/rebote-neon/jugar`.

## Decisiones

- **Sí:** nombre REBOTE NEÓN e id `rebote-neon`. Decisión del usuario; es la sugerencia de `game-planner`. El juego no usa el nombre, el arte ni el aspecto del prototipo de origen.
- **Sí:** entrada nueva en `games`, sin puntuaciones. El mock parecido (`bloque-buster`) ya se eliminó en `20261105203829_remove_mock_games.sql`, así que no hay nada que reutilizar.
- **Sí:** ficha `ARCADE`, `green` y `sort_order` 3. Decisión del usuario; `green` no lo usa ningún juego real y `ARCADE` no exige `ALTER TYPE`.
- **Sí:** ángulo de rebote según el punto de impacto (hasta 60°) y lanzamiento con `Espacio` o clic. Decisión del usuario; da control y habilidad para competir. Los 60° son el valor técnico propuesto.
- **No:** ángulo fijo y salida automática del prototipo.
- **Sí:** rebote en bloques según la cara de menor solapamiento. Decisión del usuario; el prototipo siempre invertía `vy`.
- **Sí:** ciclo infinito de los 5 patrones con velocidad `min(1.1^(n-1), 2.0)`. Decisión del usuario; sin techo de puntuación, el leaderboard distingue a los buenos jugadores. Se usa la fórmula en lugar de los valores redondeados de `levels.js` (1,21, 1,33, 1,46), que difieren menos de un 0,5 %.
- **No:** estado de victoria al acabar el nivel 5, ni velocidad sin tope.
- **Sí:** puntuación `10 × nivel × voltaje`, con voltaje hasta ×5. Decisión del usuario; el voltaje es el giro propio del juego.
- **No:** 10 puntos fijos por bloque. Con el ciclo infinito, apenas distinguen a los jugadores.
- **Sí:** tras vaciar un nivel o perder una vida, la pelota vuelve a la paleta y espera el lanzamiento con "NIVEL N". Decisión del usuario.
- **No:** selector de nivel en la pausa. No funciona dentro de la pausa de la plataforma, que congela el bucle y tapa el canvas, y permitiría saltarse niveles en el ranking.
- **Sí:** dibujo vectorial con las tres skins desde el primer día. Decisión del usuario; es obligatorio para motores nuevos, y evita cargar un PNG y mantener dos caminos de dibujo.
- **Sí:** CLÁSICO usa los tonos que se ven en el spritesheet, no los nombres de `spritesheet.js`. En el PNG, el sprite llamado `cyan` es verde agua, `green` es azul, `magenta` es violeta y `hotpink` es naranja. Los colores lógicos se mantienen para portar `levels.js` sin cambios.
- **Sí:** el canvas solo muestra el voltaje, el aviso de saque y `GAME OVER`. Decisión del usuario; Puntuación, Vidas y Nivel ya están en el HUD de React.
- **Sí:** los dos MP3 del prototipo en `public/games/rebote-neon/`. Decisión del usuario. Se crean dentro de la factoría y un bloqueo de autoplay no rompe el juego.
- **Sí:** subpasos de ≤ 8 px por frame para que la pelota no atraviese bloques a velocidad alta. El prototipo no los necesitaba porque su velocidad máxima era ×1,46.
- **Sí:** `lives: true` en el registro y sin ampliación de la plataforma. El juego cabe en 800×600 con `score`, `lives` y `level`.
- **No:** bloques conductores en cadena (parte de la idea original de `game-planner`). Si llegan, van en otra spec.

## Riesgos

| Riesgo                                                                                                                                    | Mitigación                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La pelota atraviesa bloques o la paleta a ×2,0 con `dt` = 50 ms                                                                           | Subpasos de ≤ 8 px y criterio de aceptación en el nivel 9.                                                                                                                            |
| `canvas.width` incluye `devicePixelRatio` y descoloca el ratón                                                                            | La escala del ratón es `W / rect.width` con las constantes lógicas; el prototipo usaba `canvas.width`.                                                                                |
| `new Audio()` a nivel de módulo rompe el render en servidor, porque `ENGINES` se importa desde un componente que también se renderiza ahí | Los `Audio` se crean dentro de `createReboteNeonGame`; nada de `document` ni `window` a nivel de módulo.                                                                              |
| `play()` rechaza la promesa sin gesto previo del usuario y deja errores en consola                                                        | `.play().catch(() => {})`. El primer sonido llega tras el lanzamiento, que ya es un gesto.                                                                                            |
| El motor también gestiona P o Escape y la pausa se duplica                                                                                | El motor no registra P ni Escape, y se quita esa parte del `keydown` del prototipo.                                                                                                   |
| Un clic o una tecla con el modal abierto relanza la pelota o reinicia algo                                                                | Toda la entrada respeta `inputEnabled && !paused`. React bloquea la entrada en el mismo `onGameOver`.                                                                                 |
| Listeners del canvas (`mousemove`, `click`) que sobreviven a SALIR                                                                        | `destroy()` retira los listeners de `window` y del canvas, y cancela el `requestAnimationFrame`.                                                                                      |
| Salto de física al reanudar o con la pestaña en segundo plano                                                                             | `dt` limitado a 50 ms y `lastTime = null` al reanudar.                                                                                                                                |
| La pelota queda atrapada en un bucle horizontal casi perfecto                                                                             | El ángulo máximo de 60° respecto a la vertical evita salidas horizontales desde la paleta.                                                                                            |
| El voltaje y las sumas producen decimales                                                                                                 | Todos los factores son enteros; el tope se aplica con `Math.min`.                                                                                                                     |
| CLÁSICO no alcanza el contraste mínimo en algún bloque (violeta o gris sobre negro)                                                       | Se mide y, si no cumple, se marca ⚠️ en el registro sin cambiar el tono, como en `tetris`.                                                                                            |
| `/juegos/rebote-neon` da 404 en una app ya levantada                                                                                      | El catálogo está cacheado con el tag `games`: reconstruir o reiniciar tras aplicar la migración. `npm run build` consulta Supabase, así que la migración se aplica antes de compilar. |
| `cover-rebote-neon` mal escrita deja la portada vacía sin error                                                                           | Comprobar la portada en `/`, `/biblioteca` y el detalle.                                                                                                                              |
| El aviso dice "REQUIERE TECLADO" aunque el juego también se juegue con ratón                                                              | Se acepta: lanzar y mover también funcionan con teclado, y el texto de controles menciona el ratón.                                                                                   |

## Lo que **no** entra en esta spec

- Spritesheet del prototipo, selector de nivel, overlay `PAUSA` y estado de victoria.
- Power-ups, bloques resistentes, multibola, láser, enemigos y bloques conductores en cadena.
- Controles táctiles, botón de silencio y pantalla completa.
- Cambios en `asteroides`, `tetris` y en la plataforma.
- Antitrampas, Realtime y Auth.

Cada uno, si llega, va en su propia spec.
