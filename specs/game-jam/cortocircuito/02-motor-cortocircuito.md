# SPEC GJ-02 — CORTOCIRCUITO: motor jugable

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06, GJ-01 (cortocircuito)
> **Fecha:** 2026-11-05
> **Objetivo:** Sustituir el motor provisional de `cortocircuito` por el juego completo y jugable de principio a fin en `/juegos/cortocircuito/jugar`, con fases, vidas, puntuación con tope y fin de partida, guardado con `submitScore` en su leaderboard.

## Por qué existe esta spec

La GJ-01 dejó `cortocircuito` en el catálogo (`PLATAFORMAS`, `yellow`, `sort_order` 3) y registrado en `ENGINES`, con un motor provisional que solo muestra "PRÓXIMAMENTE". Esta spec define el MVP del juego. Es un plataformas de pantalla fija sobre una placa de circuito: OHM-1 salta y golpea las pistas desde abajo, el golpe lanza un **pulso de cortocircuito** que aturde a las chispas que lo tocan, y OHM-1 las expulsa tocándolas.

El juego sigue la línea de los plataformas de pantalla fija en los que se golpea a los enemigos desde abajo, como Mario Bros. (1983), que se cita solo como referencia de género. Su giro propio tiene dos partes:

1. **El golpe no aturde en un punto: se propaga.** El pulso corre por la pista a 900 px/s en los dos sentidos hasta el extremo o hasta el **aislante** más cercano, y aturde a todas las chispas que alcanza en ese tramo. Elegir dónde golpear (y no golpear un aislante) es la habilidad central.
2. **Tensión.** Cada chispa que se recupera del aturdimiento o que vuelve a entrar por una toma de tierra sube un nivel de tensión (1 a 4): corre más, cambia de color y vale más puntos. Dejar chispas sin expulsar se paga.

Es el tercer motor real. Cumple el contrato `CreateEngine` sin ampliar la plataforma: usa vidas (`lives: true`) y el HUD fijo de React (Puntuación, Vidas y Nivel, donde Nivel es la fase).

## Alcance

**Entra:**

- Motor en `lib/engines/cortocircuito/`, registrado en `ENGINES` (ya existe la entrada de la GJ-01), que cumple `CreateEngine` y reemplaza el `game.ts` provisional.
- Mecánicas:
  - **Placa fija** con 5 pistas elevadas, el suelo, 2 bornes de entrada arriba y 2 tomas de tierra en los extremos del suelo (ver la tabla de zonas).
  - **OHM-1**: se mueve, salta con altura variable y atraviesa los bordes laterales de la pantalla, apareciendo por el lado contrario. Golpear una pista desde abajo crea un pulso.
  - **Pulso de cortocircuito**: dos frentes desde el punto de golpe a 900 px/s, limitados al tramo conductor (entre aislantes o extremos de la pista). Aturde a las chispas que pisan ese tramo y renueva el aturdimiento de las ya aturdidas. Golpear un aislante no crea pulso.
  - **Chispas**: salen de los bornes, caminan, caen al acabar una pista, atraviesan los bordes laterales en las pistas que los tocan y, en el suelo, entran en las tomas de tierra y reaparecen arriba con +1 de tensión. No se pueden aturdir en el suelo.
  - **Aturdimiento**: la chispa aturdida se queda quieta y es inofensiva durante un tiempo que depende de la fase. Si no se expulsa, se recupera con +1 de tensión.
  - **Expulsión**: tocar una chispa aturdida la expulsa de la placa con una animación y puntos.
  - **Cadena**: las expulsiones seguidas con menos de 2 s entre ellas multiplican los puntos, hasta ×5.
  - **Vidas**: 3. Tocar una chispa activa quita una vida. Tras la animación de muerte, OHM-1 reaparece en el centro del suelo con 2 s de invulnerabilidad.
  - **Fases**: cada fase tiene un número fijo de chispas. Al expulsarlas todas, se suma un bonus y empieza la siguiente, más rápida. `level` = fase.
  - **Fin de partida** al perder la última vida o con `end()`.
- Controles: `←` `→` mueven; `↑`, `Espacio` o `Z` saltan (mantener la tecla da un salto más alto). La expulsión es por contacto, sin tecla.
- Puntuación entera con tope de 10.000.000 (ver el apartado Modelo de datos).
- Aspecto: placa de circuito CRT, con pistas verdes, chispas por color de tensión, pulso amarillo y OHM-1 cian, sobre fondo `#0a0a0f`.
- HUD del canvas: franja superior (PUNTOS, FASE, vidas) y franja inferior (CHISPAS, CADENA). Textos de fase y overlay de fin "SISTEMA APAGADO" dibujados en el canvas.
- HUD de React sin cambios: Jugador, Puntuación, Vidas y Nivel, alimentados por `onStats`.
- Notificaciones a React: `onStats` solo cuando cambian los valores y `onGameOver` al terminar la partida.
- Leaderboard real sin código propio: el guardado usa `submitScore`, y el detalle y el Salón leen la vista `leaderboard`.

**Fuera de alcance:**

- Todo lo de la GJ-03:
  - Curva de dificultad por tabla de fases y tensión inicial mayor que 1.
  - Tipos de chispa ARCO y DÍNAMO.
  - Relés (aislantes conmutables) y aislantes extra por fase.
  - Medidor de sobrecarga y DESCARGA A TIERRA con la tecla X.
  - Power-ups FUSIBLE y CONDENSADOR, y vidas por encima de 3.
  - Bonus CIRCUITO LIMPIO.
  - Partículas, destello de pista, sacudida de pantalla y resplandor de antena.
- Sonido, controles táctiles, mando y pantalla completa.
- Choques entre chispas (se atraviesan entre sí).
- Pantalla de título o menú dentro del canvas: la partida empieza al montar el motor.
- Cambios en `components/game-player.tsx`, `components/game-canvas.tsx`, `lib/engines/types.ts`, en el catálogo y en la portada (GJ-01).
- Cambios en `asteroides` y `tetris`.
- Antitrampas, Realtime y Auth.
- Tests automatizados.

## Modelo de datos

Sin cambios de esquema ni de catálogo: la fila de `games`, la categoría `PLATAFORMAS` y la entrada de `ENGINES` ya existen por la GJ-01. El texto de `controls` no cambia.

### Constantes (`lib/engines/cortocircuito/level.ts`)

| Constante               | Valor                      | Uso                                                                |
| ----------------------- | -------------------------- | ------------------------------------------------------------------ |
| `W`, `H`                | 800, 600                   | Resolución lógica                                                  |
| `HUD_TOP`               | 40                         | Techo de la zona de juego (y 0–40, franja superior)                |
| `FLOOR_Y`               | 520                        | Superficie del suelo                                               |
| `PLATFORM_T`            | 12                         | Grosor de las pistas elevadas                                      |
| `GRAVITY`               | 1800 px/s²                 | Gravedad de OHM-1 y de las chispas                                 |
| `MAX_FALL`              | 900 px/s                   | Velocidad máxima de caída                                          |
| `PLAYER_W`, `PLAYER_H`  | 24, 36                     | Caja de OHM-1                                                      |
| `MOVE_SPEED`            | 220 px/s                   | Velocidad horizontal, igual en suelo y en el aire                  |
| `JUMP_SPEED`            | 735 px/s                   | Impulso del salto (altura máxima ≈ 150 px)                         |
| `JUMP_CUT_SPEED`        | 300 px/s                   | Si se suelta el salto subiendo más rápido, `vy` pasa a −300        |
| `JUMP_BUFFER`           | 0,10 s                     | Un salto pulsado justo antes de aterrizar se ejecuta al aterrizar  |
| `COYOTE_TIME`           | 0,08 s                     | Se puede saltar hasta 80 ms después de dejar una pista             |
| `SPAWN_X`, `SPAWN_FEET` | 400, 520                   | Aparición de OHM-1 (centro del suelo)                              |
| `START_LIVES`           | 3                          | Vidas iniciales                                                    |
| `INVULN_TIME`           | 2,0 s                      | Invulnerabilidad al reaparecer (parpadeo cada 0,1 s)               |
| `DEATH_TIME`            | 1,2 s                      | Duración de la animación de muerte; el mundo se congela            |
| `SPARK_SIZE`            | 20                         | Caja de una chispa (radio de dibujo 10)                            |
| `SPARK_SPEED`           | `[70, 100, 135, 175]` px/s | Velocidad por tensión 1–4                                          |
| `MAX_TENSION`           | 4                          | Tensión máxima de una chispa                                       |
| `STUN_HOP`              | 180 px/s                   | Saltito al aturdirse y al recuperarse                              |
| `STUN_BLINK`            | 1,0 s                      | Último tramo del aturdimiento en que la chispa parpadea            |
| `PULSE_SPEED`           | 900 px/s                   | Velocidad de cada frente del pulso                                 |
| `PULSE_FADE`            | 0,15 s                     | Desvanecimiento del pulso al llegar a sus límites                  |
| `BUMP_COOLDOWN`         | 0,20 s                     | Tiempo mínimo entre dos pulsos                                     |
| `HIT_INSET`             | 4                          | Margen que se recorta a cada lado en el choque con chispas activas |
| `TERMINAL_W`            | 24                         | Ancho de cada toma de tierra en los extremos del suelo             |
| `FIRST_SPAWN_DELAY`     | 1,5 s                      | Espera antes de la primera chispa de cada fase                     |
| `PHASE_CLEAR_TIME`      | 2,0 s                      | Pausa con el texto de fase completada                              |
| `CHAIN_WINDOW`          | 2,0 s                      | Tiempo máximo entre expulsiones para mantener la cadena            |
| `CHAIN_MAX`             | 5                          | Multiplicador máximo                                               |
| `MAX_SCORE`             | 10.000.000                 | Tope de puntuación                                                 |

Funciones de fase, con `f` = fase (empieza en 1):

- `sparksForPhase(f) = Math.min(3 + f, 10)`
- `spawnInterval(f) = Math.max(1.2, 2.5 - 0.1 * (f - 1))` s
- `stunTime(f) = Math.max(2.5, 5 - 0.3 * (f - 1))` s
- `speedFactor(f) = 1 + 0.05 * Math.min(f - 1, 8)`. Velocidad de una chispa = `SPARK_SPEED[tensión - 1] × speedFactor(f)`.

### Disposición del canvas (coordenadas lógicas de 800×600)

| Zona            | Rectángulo           | Contenido                                                                                                                         |
| --------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Franja superior | x 0–800, y 0–40      | Fondo `#0a0a0f`, línea inferior `#15151f`. `PUNTOS 12.345` a la izquierda (x 16), `FASE 01` centrado (x 400) y vidas a la derecha |
| Borne izquierdo | x 16–64, y 56–84     | Caja con borde `#ff006e` de 2 px y 3 patas. Las chispas aparecen con centro en (40, 70) y dirección →                             |
| Borne derecho   | x 736–784, y 56–84   | Igual. Las chispas aparecen con centro en (760, 70) y dirección ←                                                                 |
| Pista A1        | x 0–260, y 150–162   | Sin aislantes                                                                                                                     |
| Pista A2        | x 540–800, y 150–162 | Sin aislantes                                                                                                                     |
| Pista B         | x 160–640, y 270–282 | Aislante en x 380–420                                                                                                             |
| Pista C1        | x 0–300, y 390–402   | Aislante en x 100–120                                                                                                             |
| Pista C2        | x 500–800, y 390–402 | Aislante en x 680–700                                                                                                             |
| Suelo           | x 0–800, y 520–540   | No se puede golpear. Tomas de tierra en x 0–24 y x 776–800                                                                        |
| Franja inferior | x 0–800, y 540–600   | Fondo `#0a0a0f`. `CHISPAS 04` a la izquierda (x 16, y 576) y `CADENA ×3` centrado (x 400, y 576) cuando la cadena es ≥ 2          |

La geometría permite subir:

- Del suelo a C1 o C2, saltando por el hueco x 300–500.
- De C1 a B, saltando desde x < 160.
- De C2 a B, saltando desde x > 640.
- De B a A1 o A2, saltando desde el hueco x 260–540.

Cada pista elevada se puede golpear desde la pista o el suelo de debajo: el salto (≈ 150 px) supera los 120–130 px entre niveles.

### Entidades (`lib/engines/cortocircuito/entities.ts`)

- **Platform** `{ id, x0, x1, y, t, insulators: [x0, x1][], bumpable }`. Las 5 pistas tienen `bumpable: true` y el suelo `false`.
- **Player**: `x`, `y` (esquina superior izquierda), `vx`, `vy`, `facing` (−1 | 1), `grounded`, `coyote`, `jumpBuffer`, `invuln`, `bumpCooldown`, `dead`.
- **Spark**: `id`, `x`, `y` (centro), `vy`, `dir` (−1 | 1), `tension` (1–4), `state` (`"falling" | "walking" | "stunned"`), `stunTimer`, `platform` (`id` de la pista que pisa, o `null`).
- **Pulse**: `platformId`, `origin`, `segL`, `segR` (tramo conductor), `left`, `right` (posición de cada frente), `hit: Set<number>` (ids de chispas ya afectadas), `stunCount` (chispas aturdidas por este pulso), `fade`.
- **Ejected**: chispa expulsada en animación: `x`, `y`, `vx`, `vy`, `angle`, `tension` y `life` 0,6 s.
- **FloatText**: texto flotante de puntos: `x`, `y`, `text`, `color` y `life` 0,8 s; sube 40 px/s.

### Reglas

**OHM-1**

- `vx = (→ − ←) × MOVE_SPEED`, y `facing` sigue a la última dirección pulsada.
- La gravedad se aplica con `vy = Math.min(vy + GRAVITY × dt, MAX_FALL)`.
- Saltar exige `grounded || coyote > 0`, y pone `vy = −JUMP_SPEED`.
- Si se suelta la tecla de salto con `vy < −JUMP_CUT_SPEED`, `vy` pasa a `−JUMP_CUT_SPEED`.
- La colisión con las pistas se resuelve por ejes, primero X y después Y, como AABB contra los rectángulos de las pistas y el suelo:
  - En X, si OHM-1 se solapa con una pista, se le empuja fuera por el lado por el que entró.
  - En Y, al bajar (`vy > 0`), aterriza sobre la pista (`grounded = true`, `vy = 0`).
  - En Y, al subir (`vy < 0`), su cabeza choca con la cara inferior de la pista: `y = pista.y + pista.t` y `vy = 0`.
- El choque de la cabeza crea un pulso si se cumplen las tres condiciones:
  - La pista es `bumpable`.
  - `bumpCooldown <= 0`.
  - El centro de OHM-1 (`x + PLAYER_W / 2`) está dentro de `[x0, x1]` y fuera de cualquier aislante.
  - Un golpe de canto (centro fuera de la pista) o sobre un aislante solo frena el salto.
- El techo es `HUD_TOP`: la cabeza no pasa de y 40 y ese choque no crea pulso.
- Bordes laterales: si el centro pasa de x < 0 o x ≥ 800, OHM-1 aparece por el lado contrario (`x ± 800`), en cualquier altura.

**Pulso**

- Al crearse, `segL` y `segR` son el extremo de aislante o de pista más cercano a cada lado de `origin`.
- Cada frame, `left = Math.max(segL, left − PULSE_SPEED × dt)` y `right = Math.min(segR, right + PULSE_SPEED × dt)`.
- Una chispa con `platform === pulse.platformId`, que no está en `hit` y con `left ≤ x ≤ right`:
  - Si está caminando, se aturde: `state = "stunned"`, `stunTimer = stunTime(fase)`, `vy = −STUN_HOP`, sigue asociada a la pista. Además, `stunCount++` y se suman `10 × stunCount` puntos.
  - Si ya está aturdida, su `stunTimer` vuelve a `stunTime(fase)`, sin puntos.
  - En ambos casos se añade a `hit`.
- El pulso no sale de su pista ni cruza aislantes, y no atraviesa el borde de la pantalla.
- Cuando `left === segL` y `right === segR`, `fade` cuenta 0,15 s y el pulso se elimina.
- Al crear un pulso, `bumpCooldown = BUMP_COOLDOWN`.

**Chispas**

- Aparición: una cada `spawnInterval(fase)` s tras `FIRST_SPAWN_DELAY`. Alternan borne izquierdo y derecho, empezando por el izquierdo, con `tension = 1` y `state = "falling"`.
- Al caminar, `x += dir × velocidad × dt`. Si su centro sale de la pista que pisa, pasa a `"falling"` con `vy = 0` y conserva `dir`.
- Al caer, aterriza en la primera pista (o en el suelo) cuya cara superior cruza, si su centro está dentro de `[x0, x1]`. Después sigue caminando en la misma dirección.
- En las pistas A1, A2, C1 y C2, que tocan el borde de la pantalla, la chispa aparece por el lado contrario (`x ± 800`), igual que OHM-1. Así A1 y A2, y también C1 y C2, quedan conectadas por el borde.
- En el suelo, si el centro entra en `x < TERMINAL_W` o en `x > 800 − TERMINAL_W`, la chispa entra en la toma de tierra. Reaparece en el borne del lado contrario (sale por la izquierda y entra por el borne derecho con `dir = −1`, y al revés) con `tension = Math.min(tension + 1, MAX_TENSION)`.
- Aturdida: no se mueve en horizontal y `stunTimer -= dt`. Al llegar a 0 se recupera: `state = "walking"`, `tension = Math.min(tension + 1, MAX_TENSION)`, `vy = −STUN_HOP` y conserva `dir`.
- Las chispas no chocan entre sí.

**Choques entre OHM-1 y chispas** (solo con `state === "playing"` y OHM-1 vivo):

- Chispa aturdida, con solape AABB completo: se expulsa. Se elimina de `sparks` y se crea un `Ejected` con `vx = 300 × signo(chispa.x − centro de OHM-1)` (o `facing` si son iguales), `vy = −350` y giro de 12 rad/s.
- Chispa activa (`walking` o `falling`), con solape AABB recortando `HIT_INSET` a cada lado de las dos cajas y `invuln <= 0`: OHM-1 muere.
  - `lives--`, `state = "dead"`, `deathTimer = DEATH_TIME` y la cadena se rompe (`chain = 0`).
  - Durante `"dead"` el mundo se congela: chispas, pulsos y temporizadores de aparición no avanzan. Solo se anima la caída de OHM-1 (salta 300 px/s hacia arriba y cae fuera de la pantalla).
  - Al terminar: si `lives === 0`, `state = "gameover"` y `gameOverPending = true`. Si no, OHM-1 reaparece en (`SPAWN_X − PLAYER_W / 2`, `SPAWN_FEET − PLAYER_H`) con `invuln = INVULN_TIME`, `vx = vy = 0` y `state = "playing"`.

**Fases**

- Estado de fase: `toSpawn = sparksForPhase(fase)`, `spawnTimer = FIRST_SPAWN_DELAY` y `phaseIntro = FIRST_SPAWN_DELAY`.
- Durante `phaseIntro` se muestra `FASE 01` en el centro. OHM-1 se puede mover.
- La fase termina cuando `toSpawn === 0` y `sparks.length === 0`. Entonces `state = "phaseclear"` durante `PHASE_CLEAR_TIME`, se suma el bonus `500 × fase` y se muestra el texto de fase completada.
- Después: `fase++`, se vacían pulsos, textos y expulsadas, OHM-1 vuelve al punto de aparición sin invulnerabilidad, `chain = 0` y se prepara la fase nueva.

### Puntuación

Toda suma pasa por `addScore(points)`: `score = Math.min(score + Math.floor(points), MAX_SCORE)`. Todas las fórmulas del MVP son enteras; el `Math.floor` protege las de la GJ-03.

| Evento                          | Puntos                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| Aturdir una chispa con un pulso | `10 × n`, donde `n` es el orden de la chispa en ese pulso (10, 20, 30…)                |
| Expulsar una chispa             | `SPARK_POINTS[tensión − 1] × multiplicador`, con `SPARK_POINTS = [100, 200, 400, 800]` |
| Completar una fase              | `500 × fase`                                                                           |

Cadena: al expulsar, `chain = chainTimer > 0 ? chain + 1 : 1`, `chainTimer = CHAIN_WINDOW` y `multiplicador = Math.min(chain, CHAIN_MAX)`. `chainTimer` baja con `dt` en `"playing"`; al llegar a 0, `chain = 0`. Cada expulsión crea un `FloatText` con `+200` o `+200 ×3` en el color de la tensión.

El juego no se puede ganar: las fases siguen hasta perder las vidas. La dificultad crece hasta la fase 14 y después se mantiene: 10 chispas desde la fase 7, velocidad ×1,4 desde la 9, aturdimiento de 2,5 s desde la 10 e intervalo de aparición de 1,2 s desde la 14.

### Valores de `GameStats`

`score` = puntuación, `lives` = vidas (0–3), `level` = fase. `chain`, las chispas restantes y la tensión solo se muestran en el canvas y no se notifican.

### Aspecto

- Fondo `#0a0a0f` en la zona de juego y cuadrícula de placa en `rgba(0, 255, 136, 0.05)` cada 40 px.
- Pistas: relleno `#0f0f18`, línea superior `#00ff88` de 2 px y pads (círculos de radio 3 en `#00ff88`) cada 40 px. Suelo igual, con 20 px de grosor.
- Aislantes: relleno `#15151f` con rayado diagonal `#4a4f70` cada 5 px y borde `#4a4f70`.
- Tomas de tierra: hueco negro en los extremos del suelo con el símbolo de tierra (tres líneas horizontales decrecientes) en `#00ff88`.
- Pulso:
  - Cada frente es un segmento de 16 px en `#f5ff00` sobre la línea superior de la pista, con `shadowBlur` 16.
  - Desde `origin` hasta cada frente hay una estela en `rgba(245, 255, 0, 0.35)` que se desvanece con `fade`.
- Chispas:
  - Estrella de 8 puntas de radio 10 que gira a 6 rad/s, con `shadowBlur` 12.
  - Color por tensión: 1 `#f5ff00`, 2 `#ffb000`, 3 `#ff006e`, 4 `#ffffff`.
  - Aturdida: radio 8, sin giro y en `#8a8fb5`. En el último `STUN_BLINK` alterna con su color cada 0,1 s.
- OHM-1:
  - Caja de 24×36 con contorno `#00f5ff` de 2 px.
  - Visor horizontal `#f5ff00` en el lado de `facing`, antena de 8 px con un punto en la punta y dos piernas que alternan al caminar.
  - Invulnerable: se dibuja solo en las décimas de segundo pares.
- Textos en `monospace`. Puntuaciones con `toLocaleString("es-ES")`, igual que el HUD de React.

### HUD y overlays del canvas

- Franja superior:
  - `PUNTOS` en `11px monospace` `#8a8fb5` y el valor en `bold 16px monospace` `#f5ff00`, en (16, 26).
  - `FASE 01` (dos dígitos) en `bold 15px monospace` `#e6e9ff`, centrado.
  - Vidas: una cabeza de OHM-1 en miniatura (12×10, cian) por vida, desde x 784 hacia la izquierda cada 20 px.
- Franja inferior:
  - `CHISPAS 04` (`toSpawn` + chispas en placa, dos dígitos) en `13px monospace` `#8a8fb5`.
  - `CADENA ×3` en `bold 15px monospace` `#ff006e`, solo con `chain >= 2`.
- Inicio de fase: `FASE 01` en `bold 36px monospace` `#f5ff00` con `shadowBlur` 16, centrado en (400, 320), durante `phaseIntro`.
- Fase completada: `FASE 01 COMPLETADA` en `bold 30px monospace` `#00ff88` en (400, 300) y `+500` en `18px monospace` `#e6e9ff` en (400, 336).
- Fin: velo `rgba(10, 10, 15, 0.75)` en todo el canvas. Encima, `SISTEMA APAGADO` en `bold 46px monospace` `#f5ff00` en (400, 282) y `PUNTUACIÓN: 12.345` en `18px monospace` `rgba(230, 233, 255, 0.75)` en (400, 322). No hay botón ni tecla de reinicio: se reinicia con JUGAR DE NUEVO.

### Estado interno

Todo vive en el cierre de `createCortocircuitoGame`:

- Partida: `player`, `sparks`, `pulses`, `ejected`, `texts`, `score`, `lives`, `level`, `chain`, `chainTimer`, `toSpawn`, `spawnTimer`, `nextBorne`, `phaseIntro`, `phaseTimer`, `deathTimer`, `nextSparkId` y `state: "playing" | "dead" | "phaseclear" | "gameover"`.
- Control: `paused`, `inputEnabled`, `keys`, `jumpQueued`, `lastStats` y `gameOverPending`.

Archivos nuevos:

```
lib/engines/cortocircuito/level.ts      // constantes, funciones de fase, PLATFORMS, BORNES, conductiveSegment
lib/engines/cortocircuito/entities.ts   // Player, Spark, Pulse, Ejected, FloatText: update y draw(ctx)
```

Archivos modificados:

```
lib/engines/cortocircuito/game.ts   // createCortocircuitoGame real: sustituye al provisional de GJ-01
```

## Plan de implementación

1. Crear `lib/engines/cortocircuito/level.ts`:
   - Las constantes y funciones de fase de esta spec.
   - `PLATFORMS` (las 5 pistas y el suelo con sus aislantes) y `BORNES`.
   - `conductiveSegment(platform, x): [number, number] | null` (`null` si `x` cae en un aislante o fuera de la pista).
   - Tipos estrictos y funciones puras, sin estado en variables de módulo y sin `window` ni `document`.
2. Crear `lib/engines/cortocircuito/entities.ts` con las clases de la spec. Cada `draw` recibe el `CanvasRenderingContext2D` como parámetro, y `update` recibe `dt` y los datos que necesite (pistas, fase), sin leer globales.
3. Reescribir `lib/engines/cortocircuito/game.ts` con `createCortocircuitoGame: CreateEngine`, siguiendo `lib/engines/asteroides/game.ts`:
   - Estado en un cierre, `initGame()` (fase 1, 3 vidas, 0 puntos, `lastStats = null`) y `startPhase()`.
   - `keydown` y `keyup` en `window`, registrados dentro de la factoría:
     - `preventDefault` en `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown` y `Space`.
     - Las flechas laterales se leen como teclas mantenidas.
     - El salto (`ArrowUp`, `Space`, `KeyZ`) solo se encola si `!e.repeat`: la autorrepetición del sistema no debe encadenar saltos.
     - El `keyup` de cualquier tecla de salto aplica el corte de salto.
     - Todo el input respeta `inputEnabled && !paused`.
     - El motor no registra `KeyP` ni `Escape`.
   - `update(dt)` con las reglas de esta spec, en este orden: temporizadores, OHM-1, pulsos, chispas, choques y fin de fase.
   - `draw()` con `setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0)`: fondo, placa, pistas, pulsos, chispas, expulsadas, OHM-1, textos, HUD y overlays.
   - Bucle con `dt = Math.min((ts − lastTime) / 1000, 0.05)` y `lastTime = null` en `start()`. Al reanudar no se acumula el tiempo en pausa.
   - `notify()` al final de cada frame: `onStats` solo si cambia `score`, `lives` o `level`, y `onGameOver` una vez cuando `gameOverPending`.
   - `pause()` y `setInputEnabled(false)` llaman a `clearInput()`.
   - `restart()` llama a `clearInput()`, `initGame()`, `draw()` y `notify()`.
   - `end()` pone `state = "gameover"`, marca `gameOverPending`, dibuja y notifica.
   - `destroy()` cancela el `requestAnimationFrame` y retira los dos listeners.
4. Comprobar que `lib/engines/index.ts` sigue cargando `./cortocircuito/game` con `import()` dinámico y que el nombre exportado es `createCortocircuitoGame`. No hay que tocar el registro.
5. Ejecutar `npm run lint` y `npm run build`, y probar a mano el flujo completo en `/juegos/cortocircuito/jugar`: las tres primeras fases, una muerte, el fin de partida, el guardado, la pausa, la salida y el reinicio.
6. Comprobar que `/juegos/asteroides/jugar` y `/juegos/tetris/jugar` siguen igual.

Antes de escribir código específico de Next o React, leer la guía correspondiente en `node_modules/next/dist/docs/`. Esta spec no debería necesitarlo, porque solo toca el motor.

## Criterios de aceptación

Específicos del juego:

- [ ] La placa muestra las 5 pistas, el suelo, los 2 bornes y las 2 tomas de tierra en las posiciones de la tabla de zonas, con aislantes rayados en B (x 380–420), C1 (x 100–120) y C2 (x 680–700).
- [ ] La partida empieza con 0 puntos, 3 vidas y fase 1. El HUD de React muestra Puntuación 0, Vidas ♥ ♥ ♥ y Nivel 01.
- [ ] `←` y `→` mueven a OHM-1 a 220 px/s. Al salir por un borde lateral aparece por el contrario.
- [ ] `↑`, `Espacio` y `Z` saltan. Mantener la tecla da un salto de unos 150 px, y soltarla pronto da uno claramente más bajo.
- [ ] Mantener pulsada la tecla de salto no encadena saltos: hace falta soltarla y volver a pulsar.
- [ ] Desde el suelo se puede subir a C1/C2, de ahí a B y de B a A1/A2 por los huecos descritos.
- [ ] Golpear desde abajo una pista fuera de un aislante dibuja dos frentes amarillos que salen del punto de golpe y se detienen en el aislante o en el extremo de la pista.
- [ ] Golpear justo bajo un aislante, o de canto, no crea pulso.
- [ ] Una chispa en el tramo del pulso se aturde (gris, quieta, saltito), y una chispa de la misma pista al otro lado del aislante no se aturde.
- [ ] Un pulso que aturde a 3 chispas suma 10 + 20 + 30 = 60 puntos.
- [ ] Un pulso que alcanza a una chispa ya aturdida renueva su aturdimiento sin sumar puntos.
- [ ] En la fase 1 la chispa aturdida se recupera a los 5 s, parpadeando el último segundo, con +1 de tensión (de amarillo a naranja) y más velocidad.
- [ ] Tocar una chispa aturdida la expulsa con una animación y suma 100, 200, 400 u 800 puntos según su tensión 1–4.
- [ ] Dos expulsiones con menos de 2 s entre ellas muestran `CADENA ×2` y la segunda vale el doble. El multiplicador no pasa de ×5.
- [ ] Tocar una chispa activa quita una vida, congela la placa 1,2 s y hace reaparecer a OHM-1 en el centro del suelo, parpadeando e invulnerable durante 2 s.
- [ ] Una chispa que llega a una toma de tierra desaparece y vuelve a salir por el borne del lado contrario con +1 de tensión.
- [ ] Las chispas en el suelo no se pueden aturdir.
- [ ] En la fase 1 salen 4 chispas, una cada 2,5 s desde 1,5 s después de empezar, alternando el borne izquierdo y el derecho. `CHISPAS` cuenta las que quedan por expulsar.
- [ ] Al expulsar la última chispa de la fase aparece `FASE 01 COMPLETADA` y `+500` durante 2 s. Después empieza la fase 2 con 5 chispas, y Nivel pasa a 02 en el HUD de React.
- [ ] Las fórmulas de fase se respetan: en la fase 3 el aturdimiento dura 4,4 s y el intervalo de aparición es 2,3 s.
- [ ] Al perder la tercera vida el canvas muestra `SISTEMA APAGADO` y `PUNTUACIÓN: N`, y las teclas ya no mueven nada.
- [ ] `PUNTOS` y `FASE` del canvas muestran los mismos valores, con el mismo formato `es-ES`, que Puntuación y Nivel del HUD de React. Las cabezas de vida coinciden con los corazones.
- [ ] Revisión de código:
  - Toda suma de puntos pasa por `addScore`, con `Math.floor` y el tope de 10.000.000.
  - El motor no registra `KeyP` ni `Escape`.
  - `dt` está limitado a 50 ms.
  - No hay `window` ni `document` a nivel de módulo en `lib/engines/cortocircuito/`.

Integración con la plataforma:

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `npx supabase db push --linked` no tiene cambios pendientes.
- [ ] `CORTOCIRCUITO` aparece en `/biblioteca` con su portada, en su filtro de categoría y en las pestañas del Salón.
- [ ] `/juegos/cortocircuito` muestra "Partidas" 0, "Mejor global" 0 y "SIN PUNTUACIONES TODAVÍA" antes de la primera partida guardada.
- [ ] `/juegos/cortocircuito/jugar` muestra el canvas jugable dentro del CRT.
- [ ] El HUD de React muestra los mismos valores que el motor, y `onStats` no se llama en frames sin cambios.
- [ ] Al terminar la partida se abre "FIN DEL JUEGO" con la puntuación final.
- [ ] Guardar crea una fila en `scores` con `game_id = 'cortocircuito'`, y detalle y Salón la muestran sin reiniciar el servidor.
- [ ] PAUSA y tecla P congelan y reanudan el juego sin saltos, y cambiar de pestaña lo pausa.
- [ ] FIN abre el modal con la puntuación actual, y JUGAR DE NUEVO empieza una partida limpia.
- [ ] Con el modal abierto, las teclas no afectan al juego y se puede escribir en el input de iniciales.
- [ ] Las teclas del juego no hacen scroll mientras se juega; tras SALIR no queda ningún bucle ni listener.
- [ ] Dos montajes seguidos no comparten estado.
- [ ] El canvas mantiene la proporción y no se ve borroso con `devicePixelRatio` 2; a 375px no hay scroll horizontal.
- [ ] `asteroides` y `tetris` siguen funcionando igual. Este proyecto ya no tiene juegos mock en el catálogo.
- [ ] No hay errores de hidratación ni de consola en `/juegos/cortocircuito` ni en `/juegos/cortocircuito/jugar`.

## Decisiones

- **Sí:** el giro de diseño es el pulso que se propaga por el tramo conductor, cortado por aislantes, más la tensión que sube al recuperarse o al pasar por una toma de tierra. Hace que el tema eléctrico se juegue (dónde golpear, cuándo expulsar), y no sea solo decorado. _(supuesto del agente, revisar)_
- **Sí:** la expulsión es por contacto, sin tecla de patada. Mantiene los controles en flechas y salto, y el "patear" del concepto se resuelve al tocar. _(supuesto del agente, revisar)_
- **Sí:** las chispas del suelo no se pueden aturdir y escapan por las tomas de tierra con +1 de tensión. Esto crea presión sin un temporizador artificial. _(supuesto del agente, revisar)_
- **Sí:** un pulso sobre una chispa ya aturdida renueva su aturdimiento. En el género clásico, un segundo golpe la "despierta"; aquí se premia golpear de nuevo para ganar tiempo. _(supuesto del agente, revisar)_
- **Sí:** `10 × n` puntos al aturdir varias chispas con un solo pulso. Premia el golpe bien colocado sin eclipsar la expulsión. _(supuesto del agente, revisar)_
- **Sí:** cadena con ventana de 2 s y tope ×5, y puntos por tensión `[100, 200, 400, 800]`. Esto permite elegir entre riesgo y recompensa: dejar subir la tensión vale más, pero es más peligroso. _(supuesto del agente, revisar)_
- **Sí:** 3 vidas, sin vidas extra en el MVP. Los power-ups de vida van en la GJ-03. _(supuesto del agente, revisar)_
- **Sí:** el mundo se congela durante la muerte (1,2 s), y OHM-1 reaparece en el centro del suelo con 2 s de invulnerabilidad. Así la muerte es legible y no hay muertes encadenadas al reaparecer. _(supuesto del agente, revisar)_
- **Sí:** el salto tiene altura variable, buffer de 100 ms y coyote de 80 ms. Da control fino para elegir el punto de golpe y no cambia la geometría.
- **Sí:** salto con `↑`, `Espacio` o `Z`, ignorando la autorrepetición (`e.repeat`). Movimiento con teclas mantenidas. Coincide con el texto de `controls` de la GJ-01.
- **Sí:** la dificultad del MVP deja de crecer en la fase 14 (10 chispas, velocidad ×1,4, aturdimiento de 2,5 s e intervalo de 1,2 s). El techo competitivo lo marcan la cadena y la tensión. La tabla de fases avanzada va en la GJ-03. _(supuesto del agente, revisar)_
- **Sí:** overlay de fin en el canvas sin reinicio propio, igual que Tetris. El reinicio llega solo por JUGAR DE NUEVO.
- **Sí:** HUD de React sin cambios (`lives: true`, Nivel = fase). Cadena y chispas restantes solo en el canvas.
- **Sí:** aislantes fijos en B, C1 y C2 en el MVP. Bastan para que el giro se note desde la fase 1; los aislantes extra y los relés van en la GJ-03. _(supuesto del agente, revisar)_
- **No:** choques entre chispas (que se den la vuelta al encontrarse). Complica la IA sin aportar al giro.
- **No:** una tecla de patada o un bloque de "golpe global" en pantalla. La patada es por contacto, y el golpe global sería demasiado cercano al juego de referencia. La GJ-03 propone en su lugar una descarga ganada con habilidad.
- **No:** mezclar mecánicas de `torre-pulso` (plataformas rítmicas, subida vertical).

## Riesgos

| Riesgo                                                                                       | Mitigación                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La resolución de colisiones por ejes deja a OHM-1 enganchado en el canto de una pista        | Resolver primero X y después Y, con las cajas tal como quedan tras mover. La prueba manual de subir por todos los huecos está en los criterios.                              |
| Un pulso de un frame largo se salta chispas                                                  | Los frentes recorren el intervalo `[left, right]` acumulado y se comprueban todas las chispas de ese intervalo. Además, `dt` está limitado a 50 ms (máximo 45 px por frame). |
| Salto de `dt` al reanudar o con la pestaña en segundo plano                                  | `dt` limitado a 50 ms y `lastTime = null` en `start()`.                                                                                                                      |
| La autorrepetición del sistema encadena saltos con la tecla mantenida                        | El salto solo se encola con `!e.repeat`, y hay un criterio de aceptación para ello.                                                                                          |
| Duplicar la pausa al gestionar P o Escape en el motor                                        | El motor no registra `KeyP` ni `Escape`; la pausa es de React.                                                                                                               |
| Una tecla llega con el modal abierto o en pausa                                              | Todo el input respeta `inputEnabled && !paused`, y `clearInput()` vacía `keys` y `jumpQueued`. React bloquea el input en el mismo `onGameOver`.                              |
| Teclas mantenidas "pegadas" tras pausar (el `keyup` llega en pausa)                          | `pause()` y `setInputEnabled(false)` llaman a `clearInput()`. El `keyup` siempre limpia, aunque el input esté deshabilitado.                                                 |
| Listeners vivos tras SALIR bloquean el scroll en otras páginas                               | Se registran en la factoría y `destroy()` los retira. Hay un criterio para ello.                                                                                             |
| `canvas.width` incluye `devicePixelRatio` y descoloca la placa                               | Se dibuja siempre en coordenadas lógicas con `setTransform`.                                                                                                                 |
| Estado compartido entre montajes (Strict Mode)                                               | Ningún estado de partida en variables de módulo: `level.ts` solo exporta constantes inmutables y funciones puras.                                                            |
| Una puntuación decimal o mayor del tope hace fallar `submitScore`                            | `addScore` aplica `Math.floor` y `Math.min(…, 10_000_000)`.                                                                                                                  |
| Una chispa recuperada justo encima de OHM-1 le quita una vida sin aviso                      | Parpadea durante el último segundo de aturdimiento. Se acepta como regla del género.                                                                                         |
| La fila de 0 puntos guardada al probar la GJ-01 rompe el criterio "SIN PUNTUACIONES TODAVÍA" | Borrarla desde el panel de Supabase antes de verificar la GJ-02, como indica la GJ-01.                                                                                       |

## Lo que **no** entra en esta spec

- Tabla de fases avanzada, tensión inicial > 1, ARCO, DÍNAMO, relés, sobrecarga y DESCARGA A TIERRA, FUSIBLE, CONDENSADOR, CIRCUITO LIMPIO y efectos visuales (GJ-03).
- Sonido, controles táctiles, mando y pantalla completa.
- Pantalla de título o menús en el canvas.
- Cambios en catálogo, portada, `GamePlayer`, `GameCanvas` y el contrato de motores.
- Cambios en `asteroides` y `tetris`.
- Antitrampas, Realtime y Auth.

Cada uno, si llega, va en su propia spec.
