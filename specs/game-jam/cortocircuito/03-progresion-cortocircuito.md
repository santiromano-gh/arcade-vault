# SPEC GJ-03 — CORTOCIRCUITO: progresión y pulido

> **Estado:** Borrador
> **Depende de:** GJ-02 (cortocircuito)
> **Fecha:** 2026-11-05
> **Objetivo:** Ampliar el MVP de `cortocircuito` con una curva de dificultad por fases, dos tipos de chispa nuevos, relés que abren y cierran el paso del pulso, el medidor de sobrecarga con su DESCARGA A TIERRA, dos power-ups y efectos visuales CRT en el canvas, sin romper la puntuación, el rendimiento ni la integración del MVP.

## Por qué existe esta spec

La GJ-02 deja un juego completo: pulso que se propaga hasta el aislante, chispas con tensión, cadena, fases y 3 vidas. Su progresión, en cambio, es solo numérica: más chispas, más rápidas y menos tiempo aturdidas. A partir de la fase 7 todas las fases se juegan igual. Esta segunda iteración convierte el giro de diseño en su versión avanzada:

- **Relés.** Algunos aislantes se vuelven conmutables y alternan entre conducir y aislar. Golpear en el momento justo hace que un pulso cubra la pista entera.
- **Chispas que esquivan o resisten el pulso.** El ARCO salta y es inmune mientras está en el aire. El DÍNAMO necesita dos pulsos.
- **Sobrecarga.** Aturdir chispas carga un medidor. Lleno, permite una DESCARGA A TIERRA que aturde a todas las chispas que pisan una superficie, también las del suelo, que en el MVP eran intocables. Se gana con habilidad; no es un bloque fijo en la placa.

Añade también dos power-ups, un bonus por fase sin daño y efectos de fósforo (partículas, destellos y sacudidas) que refuerzan el lenguaje CRT. Es opcional: el MVP de la GJ-02 es jugable sin ella.

## Alcance

**Entra:**

- Tabla de fases: composición de chispas por tipo, tensión inicial, aislantes extra y relés según la fase.
- Tipo de chispa **ARCO** (desde la fase 3): da saltitos periódicos y en el aire no le afecta el pulso.
- Tipo de chispa **DÍNAMO** (desde la fase 5): lleva un escudo que el primer pulso rompe sin aturdirla; el segundo la aturde. Vale el doble.
- **Aislantes extra** en A1 y A2 desde la fase 3.
- **Relés** desde la fase 4: el aislante de B, y desde la fase 7 también los de C1 y C2, alternan entre conductor y aislante.
- **Medidor de sobrecarga** (0–10) y **DESCARGA A TIERRA** con la tecla `X`.
- Power-ups **FUSIBLE** (+1 vida, máximo 5) y **CONDENSADOR** (8 s de pulsos que ignoran aislantes y relés y corren más rápido).
- Bonus **CIRCUITO LIMPIO** al completar una fase sin perder vidas.
- Efectos visuales en el canvas: partículas, destello de la pista bajo el pulso, sacudida de pantalla, destello de descarga y antena de OHM-1 que brilla según la carga.
- Textos de aviso de novedad al empezar ciertas fases.
- HUD del canvas ampliado: medidor de sobrecarga y temporizador del CONDENSADOR.
- Texto de `controls` de `cortocircuito` en `ENGINES` ampliado con la tecla `X`.

**Fuera de alcance:**

- Sonido y música. El diseño no los necesita para leerse: todos los avisos son visuales.
- Geometrías de placa nuevas: las pistas, los bornes y el suelo de la GJ-02 no cambian.
- Jefes, fases de bonus, pantalla de título, menús, modos de juego y dos jugadores.
- Guardar el progreso o la fase alcanzada en Supabase: solo se guarda la puntuación, como hasta ahora.
- Cambios en `components/game-player.tsx`, `components/game-canvas.tsx`, `lib/engines/types.ts`, en el catálogo y en la portada.
- Cambiar los textos `short` y `long` de `games` para mencionar las mecánicas nuevas: exige una migración propia (ver Decisiones).
- Cambios en `asteroides` y `tetris`.
- Antitrampas, Realtime y Auth.
- Tests automatizados.

## Modelo de datos

Sin cambios de esquema ni de catálogo. Cambia solo el texto de `controls` en `lib/engines/index.ts`:

```ts
controls:
  "flechas ← → para moverte, ↑, Espacio o Z para saltar y golpear las pistas desde abajo, X para la descarga.",
```

### Tabla de fases (`lib/engines/cortocircuito/level.ts`)

Se mantienen las funciones de la GJ-02 (`sparksForPhase`, `spawnInterval`, `stunTime` y `speedFactor`) y se añaden estas, con `f` = fase:

- `arcosForPhase(f) = Math.min(Math.max(f - 2, 0), 3)`
- `dinamosForPhase(f) = Math.min(Math.max(f - 4, 0), 3)`
- Normales = `sparksForPhase(f) − arcos − dínamos`.
- `startTension(f) = f >= 8 ? 2 : 1`, igual para todos los tipos.
- Orden de aparición: la lista de tipos de la fase se baraja con Fisher-Yates y `Math.random` al empezar la fase. Los bornes siguen alternando como en la GJ-02.
- Aislantes extra (`f >= 3`): A1 en x 120–140 y A2 en x 660–680.
- Relés:
  - `f >= 4`: el aislante de B (x 380–420) es un relé.
  - `f >= 7`: los aislantes de C1 (x 100–120) y C2 (x 680–700) también son relés.

Resultado para las primeras fases:

| Fase | Chispas | Normales | ARCO | DÍNAMO | Tensión inicial | Aislantes extra | Relés     |
| ---- | ------- | -------- | ---- | ------ | --------------- | --------------- | --------- |
| 1    | 4       | 4        | 0    | 0      | 1               | No              | —         |
| 2    | 5       | 5        | 0    | 0      | 1               | No              | —         |
| 3    | 6       | 5        | 1    | 0      | 1               | A1, A2          | —         |
| 4    | 7       | 5        | 2    | 0      | 1               | A1, A2          | B         |
| 5    | 8       | 4        | 3    | 1      | 1               | A1, A2          | B         |
| 6    | 9       | 4        | 3    | 2      | 1               | A1, A2          | B         |
| 7    | 10      | 4        | 3    | 3      | 1               | A1, A2          | B, C1, C2 |
| 8+   | 10      | 4        | 3    | 3      | 2               | A1, A2          | B, C1, C2 |

Avisos de novedad: una segunda línea bajo `FASE NN` durante `phaseIntro`, en `14px monospace` `#ff006e` en (400, 352).

| Fase | Aviso                                   |
| ---- | --------------------------------------- |
| 3    | `NUEVA CHISPA: ARCO · NUEVOS AISLANTES` |
| 4    | `RELÉS ACTIVOS`                         |
| 5    | `NUEVA CHISPA: DÍNAMO`                  |
| 7    | `MÁS RELÉS`                             |
| 8    | `TENSIÓN INICIAL 2`                     |

### Constantes nuevas

| Constante          | Valor                           | Uso                                                                  |
| ------------------ | ------------------------------- | -------------------------------------------------------------------- |
| `RELAY_PERIOD`     | 3,0 s                           | Ciclo de un relé: 1,5 s conductor y 1,5 s aislante                   |
| `RELAY_OFFSET`     | 1,5 s                           | Desfase de los relés de C1 y C2 respecto al de B                     |
| `RELAY_WARN`       | 0,3 s                           | El LED del relé parpadea antes de conmutar                           |
| `ARC_HOP_INTERVAL` | 1,6 s                           | Cada cuánto salta un ARCO (fase inicial aleatoria en 0–1,6 s)        |
| `ARC_HOP_SPEED`    | 420 px/s                        | Impulso del saltito del ARCO (≈ 49 px)                               |
| `DYNAMO_SPEED`     | 0,85                            | Factor de velocidad del DÍNAMO                                       |
| `SHIELD_REGEN`     | 4,0 s                           | El escudo del DÍNAMO se regenera si no se aturde en ese tiempo       |
| `TYPE_POINTS`      | normal ×1, ARCO ×1,5, DÍNAMO ×2 | Factor sobre `SPARK_POINTS` al expulsar                              |
| `CHARGE_MAX`       | 10                              | Capacidad del medidor de sobrecarga                                  |
| `POWERUP_EVERY`    | 6                               | Una expulsión de cada 6 suelta un power-up                           |
| `POWERUP_LIFE`     | 8,0 s                           | Tiempo de un power-up en la placa (parpadea los 2 últimos s)         |
| `FUSE_CHANCE`      | 0,3                             | Probabilidad de FUSIBLE si `lives < MAX_LIVES`                       |
| `MAX_LIVES`        | 5                               | Máximo de vidas con FUSIBLE                                          |
| `CONDENSER_TIME`   | 8,0 s                           | Duración del CONDENSADOR                                             |
| `CONDENSER_SPEED`  | 1,5                             | Factor sobre `PULSE_SPEED` durante el CONDENSADOR                    |
| `CLEAN_BONUS`      | 1000 × fase                     | Bonus CIRCUITO LIMPIO                                                |
| `MAX_PARTICLES`    | 400                             | Tope de partículas vivas; al superarlo se descartan las más antiguas |

### Reglas nuevas

**Relés**

- Un relé es un aislante con `relay: true` y `offset` (0 en B, `RELAY_OFFSET` en C1 y C2).
- Su estado se calcula con el tiempo de la fase: `conduce = ((phaseClock + offset) % RELAY_PERIOD) < RELAY_PERIOD / 2`. `phaseClock` empieza en 0 al empezar cada fase y no avanza en `"dead"`, `"phaseclear"` ni en pausa.
- `conductiveSegment` ignora los relés que conducen.
- El tramo de un pulso se fija al crearlo, con el estado de los relés en ese instante: un relé que conmuta después no corta ni extiende un pulso en curso.
- Golpear justo debajo de un relé que conduce crea pulso. Debajo de un relé que aísla, no.
- Dibujo: el relé conductor se dibuja como pista normal con un LED `#00ff88` de radio 3 en su centro. El aislante, rayado como un aislante fijo, con el LED en `#ff006e`. En los últimos `RELAY_WARN` antes de conmutar, el LED parpadea cada 0,05 s.

**ARCO**

- Camina como una chispa normal. Cada `ARC_HOP_INTERVAL` s, si está caminando, salta con `vy = −ARC_HOP_SPEED` y conserva `dir` y la velocidad horizontal.
- Mientras está en el aire, `platform = null`, así que ningún pulso lo afecta.
- Aterriza con las mismas reglas de caída de la GJ-02. Puede acabar en otra pista si salta cerca de un extremo.
- Dibujo: dos arcos en zigzag de radio 10 en el color de su tensión, en lugar de la estrella.

**DÍNAMO**

- Velocidad × `DYNAMO_SPEED`. Empieza con `shield = true`, dibujado como un anillo `#00f5ff` de radio 14 con `shadowBlur` 10.
- Un pulso que lo alcanza con escudo lo rompe sin aturdirlo: `shield = false`, `shieldTimer = SHIELD_REGEN`, +10 puntos fijos, y entra en el `hit` de ese pulso. El mismo pulso no lo aturde.
- Sin escudo, el siguiente pulso lo aturde como a una chispa normal (y cuenta en el `10 × n`).
- Si `shieldTimer` llega a 0 sin estar aturdido, recupera el escudo. Al recuperarse de un aturdimiento, vuelve con escudo.

**Sobrecarga y DESCARGA A TIERRA**

- `charge` (0 a `CHARGE_MAX`):
  - +1 por cada chispa que un pulso aturde (pasa de activa a aturdida).
  - +1 extra por cada pulso que aturde a 2 o más.
  - Romper un escudo no suma.
  - `charge` no pasa de 10 y se conserva entre fases y vidas.
- Con `charge === CHARGE_MAX`, la tecla `X` (solo `!e.repeat` y en `state === "playing"`) lanza la DESCARGA:
  - Todas las chispas activas que pisan una superficie, incluido el suelo, se aturden (el DÍNAMO, aunque tenga escudo), con 10 puntos fijos por chispa.
  - Las chispas en el aire no se ven afectadas.
  - Las que ya estaban aturdidas renuevan su `stunTimer`.
  - Después, `charge = 0`.
- Con `charge < CHARGE_MAX`, `X` no hace nada.
- `X` se añade a las teclas con `preventDefault`. El motor sigue sin registrar `KeyP` ni `Escape`.

**Power-ups**

- `expelCount` cuenta las expulsiones de la partida.
- Cada vez que `expelCount % POWERUP_EVERY === 0` y no hay otro power-up en la placa, se suelta uno en la posición de la chispa expulsada.
- Tipo: si `lives < MAX_LIVES` y `Math.random() < FUSE_CHANCE`, FUSIBLE; si no, CONDENSADOR.
- El power-up cae con `GRAVITY` y se posa en la primera superficie. Dura `POWERUP_LIFE`, parpadea los 2 últimos segundos y se recoge por solape AABB con OHM-1 (caja de 16×16).
- **FUSIBLE**: `lives = Math.min(lives + 1, MAX_LIVES)`. Se dibuja como un cilindro de 16×10 con casquillos `#e6e9ff` y filamento `#00ff88`.
- **CONDENSADOR**: `condenser = CONDENSER_TIME`. Mientras dura:
  - Los pulsos usan la pista entera como tramo, ignorando aislantes y relés.
  - Los pulsos corren a `PULSE_SPEED × CONDENSER_SPEED`.
  - Golpear justo debajo de un aislante también crea pulso.
  - Se dibuja como dos placas paralelas de 6×16 en `#f5ff00`. Recoger otro reinicia el tiempo a 8 s.
- Al cambiar de fase, el power-up de la placa desaparece, pero un CONDENSADOR activo conserva su tiempo restante. Al perder una vida, el CONDENSADOR se cancela.

**CIRCUITO LIMPIO**

- `livesLostThisPhase` se pone a `false` al empezar cada fase y a `true` al perder una vida.
- Al completar la fase sin haber perdido ninguna, se suma `1000 × fase` además del bonus de fase. Se muestra una tercera línea, `CIRCUITO LIMPIO +3.000`, en `bold 18px monospace` `#00f5ff` en (400, 366).

### Puntuación (versión completa)

Todo sigue pasando por `addScore(points)`, que hace `Math.min(score + Math.floor(points), MAX_SCORE)`. El factor ×1,5 del ARCO es el primer caso que produce decimales, y por eso el `Math.floor` es obligatorio.

| Evento                        | Puntos                                                                      |
| ----------------------------- | --------------------------------------------------------------------------- |
| Aturdir con un pulso          | `10 × n` (sin cambios)                                                      |
| Romper el escudo de un DÍNAMO | 10                                                                          |
| Aturdir con la DESCARGA       | 10 por chispa                                                               |
| Expulsar                      | `Math.floor(SPARK_POINTS[tensión − 1] × TYPE_POINTS[tipo]) × multiplicador` |
| Completar una fase            | `500 × fase` (sin cambios)                                                  |
| CIRCUITO LIMPIO               | `1000 × fase`                                                               |

### Valores de `GameStats`

Igual que en la GJ-02: `score`, `lives` (ahora de 0 a 5) y `level` = fase. El HUD de React pinta tantos corazones como `lives`, sin cambios de código. `charge` y `condenser` no se notifican.

### Efectos visuales (`lib/engines/cortocircuito/effects.ts`)

- **Partículas**: `Particle { x, y, vx, vy, life, maxLife, color, size }` con gravedad de 600 px/s². Se dibujan como cuadrados de 2–3 px con alfa `life / maxLife`.
  - Al aturdir: 6 partículas `#8a8fb5`.
  - Al expulsar: 16 en el color de la tensión.
  - Al romper un escudo: 10 `#00f5ff`.
  - Al morir OHM-1: 24 `#00f5ff`.
  - En la DESCARGA: 20 `#f5ff00` repartidas sobre cada pista y el suelo.
  - Al recoger un power-up: 12 del color del power-up.
  - Velocidades aleatorias de 60–220 px/s y vida de 0,4–0,8 s.
- **Destello de pista**: mientras un pulso está activo, se rellena `[left, right]` en los 4 px sobre la pista con `rgba(245, 255, 0, 0.25)`. Durante el CONDENSADOR, en `rgba(245, 255, 0, 0.4)`.
- **Sacudida**: `shake = { time, duration, amp }`. Cada frame se desplaza solo la zona de juego (y 40–540) con un `translate` aleatorio en `±amp × time / duration`. Las franjas de HUD no se mueven.
  - Al perder una vida: 8 px durante 0,35 s.
  - En la DESCARGA: 12 px durante 0,4 s.
- **Destello de descarga**: velo blanco sobre la zona de juego, con alfa de 0,5 a 0 en 0,25 s.
- **Antena de OHM-1**: el punto de la antena se dibuja en `#f5ff00` con `shadowBlur = 2 + charge × 1.4`. Con la carga llena, el radio oscila entre 2 y 4 px a 4 Hz.
- **Estela de chispas de tensión 4**: 3 copias anteriores de la estrella con alfa 0,3, 0,2 y 0,1. Se guardan las últimas 3 posiciones de esas chispas.
- Los efectos nunca cambian la lógica: si se desactivan, la partida y la puntuación son idénticas.
- No se añaden scanlines ni viñeta en el canvas: ya las pone `.crt-screen` en CSS.

### HUD del canvas ampliado

- Franja inferior:
  - `CARGA` en `11px monospace` `#8a8fb5` en x 520. A su derecha, 10 celdas de 20×12 con 2 px de separación, desde x 566 hasta x 784, en y 566. Las llenas en `#f5ff00` y las vacías con borde `#4a4f70`.
  - Con la carga llena, `X: DESCARGA` en `bold 13px monospace` `#f5ff00`, parpadeando a 2 Hz, sobre las celdas en y 556.
  - `CONDENSADOR 5.2` (un decimal, con `toFixed(1)`) en `bold 13px monospace` `#f5ff00` en x 200, solo mientras dura.
  - `CADENA ×N` sigue centrado.
- Franja superior: las cabezas de vida llegan hasta 5 (de x 784 a x 704).

Archivos nuevos:

```
lib/engines/cortocircuito/effects.ts   // Particle, ParticleSystem (tope MAX_PARTICLES), Shake, Flash
```

Archivos modificados:

```
lib/engines/cortocircuito/level.ts      // tabla de fases, aislantes extra, relés, constantes nuevas
lib/engines/cortocircuito/entities.ts   // tipos de chispa (normal, ARCO, DÍNAMO), PowerUp, antena
lib/engines/cortocircuito/game.ts       // relés, sobrecarga, X, power-ups, CIRCUITO LIMPIO, efectos, HUD
lib/engines/index.ts                    // texto de controls con la tecla X
```

## Plan de implementación

1. En `level.ts`, añadir las funciones de la tabla de fases, las constantes nuevas y los relés:
   - Los relés se marcan con `relay: true` y `offset`.
   - `isConducting(insulator, phaseClock)` decide si un aislante deja pasar el pulso.
   - `conductiveSegment(platform, x, phaseClock, condenser)` sustituye a la versión de la GJ-02 y tiene en cuenta los relés y el CONDENSADOR.
   - Los aislantes extra de A1 y A2 se activan según la fase.
   - Todo sigue siendo puro y sin estado de módulo.
2. En `entities.ts`:
   - Añadir `kind: "normal" | "arco" | "dinamo"` a `Spark`, con `hopTimer`, `shield` y `shieldTimer`, y su dibujo.
   - Añadir `PowerUp` con sus dos tipos.
   - Añadir a `Player` el brillo de antena según `charge`.
3. Crear `effects.ts` con el sistema de partículas (tope de 400), la sacudida y el destello. Cualquier canvas auxiliar se crearía dentro de la factoría, nunca a nivel de módulo (en principio no hace falta ninguno).
4. En `game.ts`:
   - `startPhase()` construye y baraja la lista de tipos, aplica `startTension` y reinicia `phaseClock`, `livesLostThisPhase` y el power-up de la placa.
   - Aplicar las reglas de pulso con relés, CONDENSADOR, DÍNAMO y ARCO.
   - Añadir `charge` y la DESCARGA con `KeyX` (`!e.repeat`, `preventDefault`).
   - Añadir `expelCount`, los power-ups y CIRCUITO LIMPIO.
   - Disparar los efectos en cada evento y dibujar la zona de juego dentro del `save`/`translate`/`restore` de la sacudida, con el HUD fuera.
   - Ampliar el HUD y los avisos de fase.
   - `initGame()` reinicia también `charge`, `condenser`, `expelCount`, partículas, sacudida y destello.
5. Actualizar el texto de `controls` en `lib/engines/index.ts`, manteniendo `import()` dinámico y `lives: true`.
6. Ejecutar `npm run lint` y `npm run build`. Probar a mano hasta la fase 8 y revisar el rendimiento con el panel Performance de las DevTools.
7. Comprobar que `/juegos/asteroides/jugar` y `/juegos/tetris/jugar` siguen igual.

Antes de escribir código específico de Next o React, leer la guía correspondiente en `node_modules/next/dist/docs/`. Esta spec no debería necesitarlo, porque solo toca el motor y el texto del registro.

## Criterios de aceptación

Específicos del juego:

- [ ] Las fases 1 y 2 se juegan exactamente como en la GJ-02: solo chispas normales, tensión 1, sin aislantes extra ni relés.
- [ ] La fase 3 muestra `NUEVA CHISPA: ARCO · NUEVOS AISLANTES`, tiene 6 chispas (una ARCO) y aislantes nuevos en A1 (x 120–140) y A2 (x 660–680).
- [ ] Un ARCO salta cada 1,6 s, y un pulso que pasa bajo él mientras está en el aire no lo aturde.
- [ ] En la fase 4, el relé de B alterna cada 1,5 s entre conductor (LED verde) y aislante (LED magenta, rayado), y parpadea antes de conmutar.
- [ ] Un pulso en B con el relé conductor recorre de x 160 a x 640. Con el relé aislante, se detiene en x 380 o x 420.
- [ ] Un relé que conmuta durante un pulso no cambia su recorrido.
- [ ] En la fase 5 aparece un DÍNAMO con anillo cian. El primer pulso rompe el anillo, suma 10 puntos y no lo aturde. El segundo lo aturde. Sin un segundo pulso, el anillo vuelve a los 4 s.
- [ ] Expulsar un DÍNAMO de tensión 1 sin cadena suma 200, y un ARCO de tensión 1, 150.
- [ ] Desde la fase 7 los relés de C1 y C2 alternan con 1,5 s de desfase respecto al de B, y desde la fase 8 las chispas salen con tensión 2 (naranja).
- [ ] El medidor `CARGA` sube 1 por chispa aturdida y 1 extra por pulso que aturde a 2 o más. No pasa de 10 y se conserva entre fases y vidas.
- [ ] Con la carga llena aparece `X: DESCARGA`. `X` aturde a todas las chispas que pisan una superficie, también en el suelo, y deja la carga en 0. Con la carga incompleta, `X` no hace nada.
- [ ] Mantener `X` no repite la descarga.
- [ ] Cada 6 expulsiones cae un power-up en el sitio de la chispa, que dura 8 s y parpadea los 2 últimos. Nunca hay dos a la vez.
- [ ] FUSIBLE suma una vida hasta 5, y el HUD de React muestra tantos corazones como cabezas hay en el canvas.
- [ ] Con 5 vidas, nunca cae un FUSIBLE.
- [ ] CONDENSADOR muestra `CONDENSADOR 8.0` bajando. Durante ese tiempo los pulsos cruzan aislantes y relés, corren más y se crean también al golpear bajo un aislante. Se cancela al perder una vida.
- [ ] Completar una fase sin perder vidas muestra `CIRCUITO LIMPIO +N` y suma `1000 × fase` además de `500 × fase`. Perder una vida en la fase lo anula.
- [ ] Partículas al aturdir, expulsar, romper escudos, morir, descargar y recoger power-ups. Destello amarillo bajo el pulso.
- [ ] Sacudida al perder una vida y en la descarga, sin mover las franjas de HUD. Velo blanco breve en la descarga.
- [ ] La antena de OHM-1 brilla más cuanto más carga hay y late con la carga llena.
- [ ] Las chispas de tensión 4 dejan una estela.
- [ ] El aviso "REQUIERE TECLADO" incluye `X para la descarga`.
- [ ] Revisión de código:
  - Toda suma de puntos sigue pasando por `addScore`, con `Math.floor` y el tope de 10.000.000.
  - Los efectos no modifican el estado de la partida.
  - No hay estado de módulo, y el motor no registra `KeyP` ni `Escape`.
- [ ] Rendimiento:
  - Con 10 chispas, 400 partículas y un pulso activo (fase 7 o superior, tras una descarga), el panel Performance de Chrome no muestra frames de más de 16,7 ms en un portátil de gama media.
  - El número de partículas vivas nunca supera 400.

Integración con la plataforma (el MVP no se rompe):

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `npx supabase db push --linked` no tiene cambios pendientes.
- [ ] `/juegos/cortocircuito/jugar` muestra el canvas jugable dentro del CRT.
- [ ] El HUD de React muestra los mismos valores que el motor, y `onStats` no se llama en frames sin cambios.
- [ ] Al terminar la partida se abre "FIN DEL JUEGO" con la puntuación final, y guardar crea una fila en `scores` con `game_id = 'cortocircuito'`.
- [ ] PAUSA y tecla P congelan y reanudan el juego sin saltos, también la conmutación de los relés y los temporizadores de CONDENSADOR y power-ups. Cambiar de pestaña lo pausa.
- [ ] FIN abre el modal con la puntuación actual, y JUGAR DE NUEVO empieza una partida limpia: fase 1, 3 vidas, carga 0, sin CONDENSADOR ni partículas.
- [ ] Con el modal abierto, las teclas (también `X`) no afectan al juego y se puede escribir en el input de iniciales.
- [ ] Las teclas del juego, `X` incluida, no hacen scroll mientras se juega; tras SALIR no queda ningún bucle ni listener.
- [ ] Dos montajes seguidos no comparten estado.
- [ ] El canvas mantiene la proporción y no se ve borroso con `devicePixelRatio` 2; a 375px no hay scroll horizontal.
- [ ] `asteroides` y `tetris` siguen funcionando igual.
- [ ] No hay errores de hidratación ni de consola en `/juegos/cortocircuito` ni en `/juegos/cortocircuito/jugar`.

## Decisiones

- **Sí:** los relés son la versión avanzada del giro de la GJ-02. El tramo del pulso pasa a depender también del momento del golpe, además de su posición. _(supuesto del agente, revisar)_
- **Sí:** el tramo del pulso se fija al crearlo, con el estado de los relés en ese instante. Es predecible y evita pulsos que se cortan a medio camino. _(supuesto del agente, revisar)_
- **Sí:** ARCO (inmune en el aire) y DÍNAMO (dos pulsos). Cada uno ataca un aspecto distinto del pulso: el momento y la repetición. _(supuesto del agente, revisar)_
- **Sí:** DESCARGA A TIERRA por medidor y con tecla `X`. Es la única forma de aturdir chispas en el suelo, y se gana encadenando aturdimientos, no recogiendo un objeto fijo de la placa. Así se aleja del bloque de golpe global del juego de referencia. _(supuesto del agente, revisar: la tecla X)_
- **Sí:** FUSIBLE hasta 5 vidas y CONDENSADOR durante 8 s, con un power-up cada 6 expulsiones. Premian la eficacia sin depender del azar del todo. _(supuesto del agente, revisar)_
- **Sí:** CIRCUITO LIMPIO de `1000 × fase`. Premia jugar sin daño, que es lo que separa las marcas altas. _(supuesto del agente, revisar)_
- **Sí:** tensión inicial 2 desde la fase 8 y composición de tipos fija a partir de la 7. Mantiene la partida exigente sin cambiar la geometría. _(supuesto del agente, revisar)_
- **Sí:** sin sonido. Todos los avisos son visuales (LED de los relés, textos de fase, medidor), y el resto de la plataforma tampoco tiene audio.
- **Sí:** efectos solo dentro del canvas y sin scanlines propias. `.crt-screen` ya aplica scanlines y viñeta en CSS.
- **Sí:** el HUD de React no cambia. Con vidas hasta 5 sigue funcionando, porque pinta `lives` corazones.
- **No:** actualizar `short` y `long` en esta spec. Exigiría una migración `update` aparte, y los textos de la GJ-01 siguen siendo ciertos (describen el núcleo). Si se quiere mencionar la descarga, va en una migración propia. _(supuesto del agente, revisar)_
- **No:** geometrías de placa distintas por fase. Obligarían a revalidar los saltos de subida; los relés y los aislantes extra cambian la estrategia sin tocar la física.
- **No:** guardar la fase alcanzada. El leaderboard solo admite puntuación.

## Riesgos

| Riesgo                                                                        | Mitigación                                                                                                                                                                        |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El factor ×1,5 del ARCO produce decimales y `submitScore` rechaza el guardado | `Math.floor` dentro del cálculo de expulsión y en `addScore`. Hay un criterio de revisión de código.                                                                              |
| Los relés conmutan durante la pausa o la muerte y desincronizan el LED        | El estado se calcula con `phaseClock`, que solo avanza en `"playing"` con el bucle activo.                                                                                        |
| Demasiadas partículas tras una descarga bajan los FPS                         | Tope de `MAX_PARTICLES` descartando las más antiguas, y un criterio de rendimiento.                                                                                               |
| La sacudida desplaza el HUD o descoloca las colisiones                        | La sacudida solo es una transformación de dibujo de la zona de juego; la lógica usa coordenadas sin desplazar.                                                                    |
| `X` repetida por autorrepetición lanza varias descargas                       | La descarga solo se dispara con `!e.repeat` y deja `charge = 0`.                                                                                                                  |
| Con CONDENSADOR, un pulso en B lo aturde todo y trivializa la fase            | Dura solo 8 s, solo cae uno cada 6 expulsiones y se cancela al morir.                                                                                                             |
| Un ARCO salta a una pista con un pulso en curso y queda aturdido "en el aire" | El pulso solo afecta a chispas con `platform === pulse.platformId`, y un ARCO en el aire tiene `platform = null`. Al aterrizar ya no entra en el `hit` de un pulso que ha pasado. |
| Confundir el relé conductor con una pista normal                              | LED verde en el centro del relé y parpadeo antes de conmutar. Los avisos de fase lo anuncian.                                                                                     |
| Romper el MVP de la GJ-02 al tocar `conductiveSegment`                        | Las fases 1 y 2 deben jugarse igual que en la GJ-02, y hay un criterio de aceptación para ello.                                                                                   |

## Lo que **no** entra en esta spec

- Sonido y música.
- Geometrías de placa nuevas, jefes, fases de bonus, menús, modos y dos jugadores.
- Guardar la fase alcanzada o cualquier dato distinto de la puntuación.
- Cambiar `short` y `long` en `games`.
- Cambios en `GamePlayer`, `GameCanvas`, el contrato de motores, el catálogo y la portada.
- Cambios en `asteroides` y `tetris`.
- Antitrampas, Realtime y Auth.

Cada uno, si llega, va en su propia spec.
