# SPEC 05 — Juego real ASTEROIDES en la plataforma

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-30
> **Objetivo:** Añadir el juego nuevo `asteroides` al catálogo, con el prototipo `references/02-asteroids` portado tal cual a un canvas en `/juegos/asteroides/jugar` que notifica a React los cambios de puntaje, vidas, nivel y fin de partida.

## Por qué existe esta spec

Hoy `/juegos/<id>/jugar` muestra una arena decorativa con puntaje simulado para todos los juegos. En `references/02-asteroids` hay un prototipo jugable en canvas puro (`game.js`, sin dependencias). Esta spec lo convierte en el primer juego real de Arcade Vault como una entrada **nueva** del catálogo, `asteroides`, distinta de la entrada mock `rocas`, que no cambia. El juego vive entero dentro del canvas, con el mismo aspecto y comportamiento que el prototipo. React solo lo enmarca, lo controla (pausa, fin, salida) y recibe sus cambios de estado. Además deja un registro id → motor para conectar los siguientes juegos (Tetris, Arkanoid) en specs futuras.

## Alcance

**Entra:**

- Nueva entrada en `GAMES` (`lib/games.ts`), añadida al final de la lista:
  - `id: "asteroides"`, `title: "ASTEROIDES"`, `cat: "SHOOTER"`, `color: "cyan"`, `cover: "cover-asteroides"`, `best: 0`, `plays: "0"`.
  - `short` y `long` nuevos que describen el juego real según el README del prototipo: rotar, propulsar, partir asteroides en fragmentos y el power-up de triple disparo, sin mencionar mecánicas que no existen.
- Portada nueva `.cover-asteroides` en `app/globals.css`, con el mismo estilo de las demás portadas CSS (sin imágenes).
- La entrada aparece automáticamente en `/biblioteca`, en `/juegos/asteroides`, en `/juegos/asteroides/jugar` y en las pestañas del Salón de la Fama, porque todas leen `GAMES`. El detalle y el Salón siguen usando el leaderboard simulado.
- Portar `references/02-asteroids/game.js` a TypeScript estricto en `lib/engines/asteroides/` **conservando el juego tal cual**:
  - Mismas mecánicas: rotación (`←` `→`), propulsión (`↑`), disparo (`Espacio`), inercia, asteroides de tamaño 3/2/1 que se parten con 20/50/100 puntos, power-up de triple disparo, 3 vidas con reaparición e invencibilidad, nivel siguiente al vaciar el campo, espacio toroidal, `dt` limitado a 50 ms y colisiones con el factor `0.82`.
  - Mismo aspecto: vectores blancos sobre fondo negro, llama naranja, power-up cian, mismas fuentes, tamaños y posiciones.
  - Mismo HUD dentro del canvas (`SCORE`, `NIVEL`, iconos de vidas, contador de triple disparo).
  - Mismo overlay de fin: "GAME OVER" y "PUNTAJE: N — ESPACIO PARA REINICIAR", con reinicio por `Espacio`.
  - Los únicos cambios de comportamiento son los que exige la integración: notificar a React, la pausa y la limpieza al desmontar (detallados abajo).
- Motor encapsulado sin variables globales ni listeners que sobrevivan al desmontar: `createAsteroidesGame(canvas, callbacks)` devuelve un controlador con `pause()`, `resume()`, `restart()`, `end()` y `destroy()`.
- Notificaciones del canvas a React:
  - `onStats({ score, lives, level })` cada vez que cambia alguno de los tres valores (incluido el estado inicial y cada reinicio), nunca en cada frame.
  - `onGameOver({ score, lives, level })` al perder la última vida o al llamar a `end()`.
- `GamePlayer` (`components/game-player.tsx`), cuando el juego tiene motor:
  - Renderiza el canvas dentro de `.crt-screen` en lugar de la arena decorativa.
  - Su HUD de React (Puntuación, Vidas, Nivel) muestra los valores que notifica el canvas.
  - Con `onGameOver` abre el modal "FIN DEL JUEGO" existente con la puntuación final y el guardado con `saveScore`. Mientras el modal está abierto el canvas no procesa teclas, así `Espacio` no reinicia por detrás del modal y el input de iniciales funciona normal.
  - "JUGAR DE NUEVO" cierra el modal y llama a `restart()`.
  - Si el jugador cierra el flujo reiniciando con `Espacio` desde el canvas (sin modal abierto, por ejemplo tras guardar y cerrar), el canvas vuelve a notificar el estado inicial y React se sincroniza.
- Controles de la plataforma sobre el motor:
  - **PAUSA / REANUDAR** pausa y reanuda el bucle; se mantiene el overlay "EN PAUSA" de React.
  - Tecla **P** alterna la pausa.
  - Pausa automática cuando la pestaña se oculta (`visibilitychange`).
  - **FIN** llama a `end()` y abre el modal con la puntuación actual.
  - **SALIR** desmonta el canvas y libera el motor.
- `preventDefault` de flechas y `Espacio` mientras el canvas procesa teclas, para que la página no haga scroll.
- Resolución lógica fija de 800×600, escalada por CSS al ancho de `.crt-screen` con proporción 4:3 y nitidez en pantallas de alta densidad (`devicePixelRatio`).
- Aviso "REQUIERE TECLADO" en dispositivos con `(pointer: coarse)`, sin bloquear el juego.
- Registro `lib/engines/index.ts` que asocia `game.id` con su motor. Los juegos sin motor (incluido `rocas`) mantienen la arena decorativa y el puntaje simulado.

**Fuera de alcance:**

- Cambios en la entrada `rocas` (textos, portada, comportamiento).
- Cambiar el aspecto del juego (paleta neón, nuevas fuentes o efectos).
- Controles táctiles en pantalla, sonido, pantalla completa o resolución variable.
- Guardar puntuaciones en Supabase, leaderboards reales o validación de puntajes en servidor (se sigue usando `saveScore` en `localStorage`).
- Que `best` y `plays` de `asteroides` se actualicen con partidas reales.
- Portar Tetris, Arkanoid u otros juegos.
- Mecánicas nuevas que no están en el prototipo.
- Tests automatizados.

## Modelo de datos

Entrada nueva en `GAMES` con el tipo `Game` existente (sin cambios en el tipo):

```ts
{
  id: "asteroides",
  title: "ASTEROIDES",
  short: "…", // texto nuevo, una línea
  long: "…", // texto nuevo, basado en el README del prototipo
  cat: "SHOOTER",
  cover: "cover-asteroides",
  color: "cyan",
  best: 0,
  plays: "0",
}
```

Contrato entre motor y React (`lib/engines/types.ts`):

```ts
export interface GameStats {
  score: number;
  lives: number;
  level: number;
}

export interface EngineCallbacks {
  // Solo cuando cambia algún valor, nunca en cada frame.
  onStats(stats: GameStats): void;
  onGameOver(stats: GameStats): void;
}

export interface GameEngine {
  pause(): void;
  resume(): void;
  restart(): void; // partida nueva: 0 puntos, 3 vidas, nivel 1
  end(): void; // fuerza el fin de partida y dispara onGameOver
  setInputEnabled(enabled: boolean): void; // false mientras el modal de React está abierto
  destroy(): void; // cancela requestAnimationFrame y quita los listeners
}

export type CreateEngine = (canvas: HTMLCanvasElement, callbacks: EngineCallbacks) => GameEngine;
```

Registro (`lib/engines/index.ts`):

```ts
export const ENGINES: Partial<Record<string, CreateEngine>> = {
  asteroides: createAsteroidesGame,
};
```

Estado interno del motor (privado): `"playing" | "dead" | "gameover"` como el prototipo, más `paused` e `inputEnabled`.

Archivos nuevos:

```
lib/engines/types.ts
lib/engines/index.ts
lib/engines/asteroides/entities.ts   // Ship, Asteroid, Bullet, Particle, PowerUp
lib/engines/asteroides/game.ts       // createAsteroidesGame: estado, update, draw, bucle, input
components/game-canvas.tsx           // componente cliente que monta el canvas y crea el motor
```

Archivos modificados:

```
lib/games.ts                 // nueva entrada asteroides
components/game-player.tsx   // canvas real, HUD con datos del motor, pausa, fin y reinicio
app/globals.css              // .cover-asteroides, canvas escalado y aviso de teclado
```

## Plan de implementación

1. Añadir la entrada `asteroides` a `GAMES` y la portada `.cover-asteroides` en `app/globals.css`. Comprobar que aparece en `/biblioteca`, `/juegos/asteroides` y el Salón, y que `/juegos/asteroides/jugar` muestra de momento la arena decorativa. Verificar que `npm run build` pasa.
2. Crear `lib/engines/types.ts` con el contrato y `lib/engines/index.ts` con el registro vacío.
3. Portar las entidades a `lib/engines/asteroides/entities.ts` con tipos estrictos y sin cambiar valores, colores ni formas. Cada `draw` recibe el `CanvasRenderingContext2D` como parámetro en lugar de leer un `ctx` global.
4. Crear `lib/engines/asteroides/game.ts` con `createAsteroidesGame`: el estado vive en un cierre; `update`, `draw`, HUD y overlay iguales al prototipo; listeners `keydown`/`keyup` en `window`, retirados en `destroy`; pausa (el bucle no actualiza y al reanudar no se acumula el tiempo pausado); `setInputEnabled`; `restart`; `end`; y `onStats`/`onGameOver` comparando con los últimos valores notificados. Registrar `asteroides` en `ENGINES`.
5. Crear `components/game-canvas.tsx` (client): canvas de 800×600 lógicos con escalado por `devicePixelRatio`. Crea el motor en `useEffect` y lo destruye en la limpieza, compatible con el doble montaje de Strict Mode. Expone el controlador al padre por `ref` o callback, según lo más simple tras leer la guía de React 19.
6. Adaptar `components/game-player.tsx`: si `ENGINES[game.id]` existe, renderizar `GameCanvas` en `.crt-screen`, alimentar el HUD de React con `onStats` y abrir el modal con `onGameOver` (con `setInputEnabled(false)` mientras está abierto). "JUGAR DE NUEVO" llama a `restart()`. Conectar PAUSA/FIN/SALIR, la tecla P y `visibilitychange`. Sin motor, el comportamiento actual no cambia.
7. Estilos en `app/globals.css`: canvas a ancho completo de `.crt-screen` con `aspect-ratio: 4 / 3`, y aviso "REQUIERE TECLADO" visible solo con `(pointer: coarse)`. Diseñar la portada y el aviso con `/frontend-design`, respetando el lenguaje visual del CRT existente.
8. Ejecutar `npm run lint` y `npm run build`, corregir errores y probar a mano en `/juegos/asteroides/jugar`.

Antes de escribir código específico de Next o React (componentes cliente, efectos, refs), leer la guía relevante en `node_modules/next/dist/docs/`.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores.
- [ ] `npm run lint` termina sin errores.
- [ ] `ASTEROIDES` aparece en `/biblioteca` (filtro SHOOTER incluido), con la portada `cover-asteroides`, y en las pestañas del Salón de la Fama.
- [ ] `/juegos/asteroides` muestra el detalle y su botón "JUGAR AHORA" lleva a `/juegos/asteroides/jugar`.
- [ ] `/juegos/asteroides/jugar` muestra el canvas jugable dentro del CRT.
- [ ] `/juegos/rocas` y `/juegos/rocas/jugar` siguen exactamente igual que antes (arena decorativa y puntaje simulado), igual que los otros juegos mock.
- [ ] El juego en el canvas se ve y se comporta como el prototipo: vectores blancos sobre negro, HUD `SCORE` / `NIVEL` / vidas y overlay de game over con los mismos textos.
- [ ] `←` `→` rotan la nave, `↑` la propulsa con inercia y `Espacio` dispara.
- [ ] Un asteroide grande da 20 puntos y se parte en 2 medianos; un mediano da 50 y se parte en 2 pequeños; un pequeño da 100 y desaparece.
- [ ] El power-up activa el triple disparo durante 5 s con la cuenta atrás en el HUD del canvas.
- [ ] Al chocar se pierde una vida y la nave reaparece a los 2 s parpadeando e invulnerable.
- [ ] Al vaciar el campo empieza el nivel siguiente con `3 + nivel` asteroides grandes.
- [ ] El HUD de React (Puntuación, Vidas, Nivel) muestra en todo momento los mismos valores que el HUD del canvas.
- [ ] `onStats` no se llama en frames en los que no cambia ningún valor.
- [ ] Al perder la tercera vida el canvas muestra su overlay "GAME OVER" y React abre el modal "FIN DEL JUEGO" con la misma puntuación.
- [ ] Con el modal abierto, `Espacio` no reinicia el canvas y se puede escribir en el input de iniciales.
- [ ] "GUARDAR PUNTUACIÓN" guarda en `av_scores` (`localStorage`) la puntuación real con `game: "asteroides"`.
- [ ] "JUGAR DE NUEVO" empieza una partida nueva y el HUD de React vuelve a 0 puntos, 3 vidas y nivel 1.
- [ ] PAUSA congela el juego y muestra "EN PAUSA"; REANUDAR continúa sin saltos de posición.
- [ ] La tecla P alterna la pausa.
- [ ] Al cambiar de pestaña y volver, el juego está en pausa.
- [ ] FIN abre el modal con la puntuación actual.
- [ ] Flechas y `Espacio` no hacen scroll de la página mientras se juega.
- [ ] Tras pulsar SALIR no queda ningún bucle ni listener del juego: en otras páginas las flechas y `Espacio` hacen scroll con normalidad.
- [ ] El canvas mantiene 4:3 y no se ve borroso a 375px de ancho ni con `devicePixelRatio` 2; a 375px no hay scroll horizontal.
- [ ] Con `(pointer: coarse)` se muestra el aviso "REQUIERE TECLADO".
- [ ] `lib/engines/` no guarda el estado de la partida en variables de módulo (dos montajes seguidos no comparten estado).
- [ ] No hay errores de hidratación ni de consola en `/juegos/asteroides/jugar`.

## Decisiones

- **Sí:** juego nuevo con id `asteroides`. Decisión del usuario: es un juego distinto de `rocas`, aunque el mock se le parezca.
- **No:** reutilizar o renombrar `rocas`. `rocas` queda como mock sin cambios, por decisión del usuario.
- **Sí:** el juego vive entero dentro del canvas, con el aspecto y el comportamiento del prototipo. Decisión del usuario; React solo lo enmarca, lo controla y recibe notificaciones.
- **No:** paleta neón. Se descarta para conservar el juego tal cual.
- **Sí:** HUD en el canvas (original) y en React (alimentado por `onStats`). Decisión del usuario.
- **Sí:** overlay original del canvas con "ESPACIO PARA REINICIAR" más el modal de React para guardar. Decisión del usuario. Mientras el modal está abierto el canvas ignora el teclado, para que no haya dos reinicios a la vez.
- **Sí:** motor en TypeScript encapsulado (`createAsteroidesGame`). Decisión del usuario; sin globales y con limpieza completa al desmontar.
- **No:** copiar `game.js` casi literal ni cargarlo como script estático. Dejaría globales y listeners vivos al navegar.
- **Sí:** carpeta `lib/engines/` en lugar de `lib/games/`. `lib/games.ts` ya existe y una carpeta con el mismo nombre haría ambiguo el import `@/lib/games`.
- **Sí:** `onStats` solo cuando cambian los valores. Evita un render de React por frame.
- **Sí:** PAUSA/FIN/SALIR, tecla P y pausa automática al ocultar la pestaña. Decisión del usuario.
- **Sí:** resolución lógica de 800×600 escalada por CSS y solo teclado. Decisión del usuario; conserva la jugabilidad del prototipo.
- **Sí:** catálogo con `SHOOTER`, `cyan`, portada `cover-asteroides`, `best: 0` y `plays: "0"`. Propuesta aceptada por el usuario; es un juego nuevo sin partidas.
- **Sí:** entrada añadida al final de `GAMES`. No cambia los 6 juegos destacados en la página de inicio; se puede mover en otra spec.
- **Sí:** registro id → motor. Decisión del usuario; Tetris y Arkanoid se conectan sin tocar la lógica de `GamePlayer`.
- **Sí:** guardado con `saveScore` en `localStorage`. Supabase y los leaderboards reales van en su propia spec.
- **Sí:** el nivel lo marca el motor (vaciar el campo). La regla de múltiplos de 2500 se mantiene solo para los juegos mock.

## Riesgos

| Riesgo                                                                      | Mitigación                                                                                                                                     |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict Mode monta el efecto dos veces y crea dos motores o dos bucles       | `destroy()` cancela el `requestAnimationFrame` y quita los listeners; hay un criterio de aceptación para que dos montajes no compartan estado. |
| Listeners de teclado vivos tras navegar bloquean el scroll en otras páginas | Todos los listeners se registran en `createAsteroidesGame` y se retiran en `destroy()`, llamado en la limpieza del efecto.                     |
| `Espacio` reinicia el canvas mientras el modal de React está abierto        | `setInputEnabled(false)` al abrir el modal y `true` al cerrarlo o reiniciar.                                                                   |
| Salto de `dt` al reanudar tras una pausa larga                              | Reiniciar la marca de tiempo al reanudar; además `dt` sigue limitado a 50 ms.                                                                  |
| `onStats` en cada frame provoca renders excesivos                           | Comparar con los últimos valores notificados antes de llamar.                                                                                  |
| El canvas se ve borroso al escalar                                          | Ajustar el tamaño del buffer con `devicePixelRatio` y escalar el contexto.                                                                     |
| Confusión entre `rocas` y `asteroides` en el catálogo                       | Textos `short`/`long` distintos y portada propia; la posible fusión o eliminación de `rocas` queda para otra spec.                             |

## Lo que **no** entra en esta spec

- Cambios en `rocas` o en los demás juegos mock.
- Paleta neón u otros cambios visuales del juego.
- Controles táctiles, sonido y pantalla completa.
- Puntuaciones en Supabase, leaderboards reales, `best`/`plays` reales o validación antitrampas.
- Portar Tetris, Arkanoid u otros juegos.

Cada uno, si llega, va en su propia spec.
