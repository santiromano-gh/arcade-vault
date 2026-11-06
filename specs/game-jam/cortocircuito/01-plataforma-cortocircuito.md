# SPEC GJ-01 — CORTOCIRCUITO: catálogo e integración en la plataforma

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-11-05
> **Objetivo:** Añadir el juego `cortocircuito` al catálogo con la categoría nueva `PLATAFORMAS`, su portada CSS y su entrada en `ENGINES` con un motor provisional "PRÓXIMAMENTE", de modo que `/juegos/cortocircuito` y `/juegos/cortocircuito/jugar` existan antes de implementar el motor real (GJ-02).

## Por qué existe esta spec

CORTOCIRCUITO es un juego de creación propia, salido de la game jam a partir de la sugerencia `cortocircuito` que `game-planner` registró en `references/game-suggestions-todo.md`. Es un juego de plataformas de pantalla fija con estética de placa de circuito. Lo controlas como OHM-1, un robot de mantenimiento. Golpeas las pistas desde abajo para lanzar un pulso de cortocircuito que corre por la pista hasta el siguiente aislante y aturde a las chispas que la recorren. Después las expulsas tocándolas antes de que se recarguen. El género sigue la línea de los plataformas de pantalla fija de principios de los 80 en los que se golpea a los enemigos desde abajo (por ejemplo, Mario Bros., de 1983). Se cita solo como referencia de género: no se toman personajes, niveles, tuberías, bloques ni aspecto.

Es el primer juego de la categoría **PLATAFORMAS**, que hoy no existe en el enum `game_category` (`ARCADE`, `PUZZLE`, `SHOOTER`, `VERSUS`). Hoy el catálogo real tiene `asteroides` (SHOOTER, `sort_order` 1) y `tetris` (PUZZLE, `sort_order` 2). La migración `20261105203829_remove_mock_games.sql` eliminó los 8 juegos mock y renumeró el catálogo.

Esta spec solo deja preparado el terreno: datos, categoría, portada y registro. El motor jugable es la GJ-02 y la progresión, la GJ-03. Separarlo así permite revisar la categoría nueva y la portada sin esperar al motor, que es el más caro de su ronda según `game-planner`.

## Alcance

**Entra:**

- Categoría nueva `PLATAFORMAS` en el enum `game_category`, en su propia migración (`alter type … add value`), anterior a la del juego.
- `npm run db:types` para regenerar `lib/supabase/database.types.ts`, con `PLATAFORMAS` en `game_category`.
- `PLATAFORMAS` añadido al final de `CATS` en `lib/games-shared.ts`, de modo que la Biblioteca muestre el chip de filtro.
- Fila nueva en `games`, añadida por migración, sin puntuaciones iniciales:
  - `id: "cortocircuito"`, `title: "CORTOCIRCUITO"`, `cat: "PLATAFORMAS"`, `color: "yellow"`, `cover: "cover-cortocircuito"`, `sort_order: 3`.
  - `short` y `long` que describen solo las mecánicas del MVP (GJ-02). Ver el apartado Modelo de datos.
- Portada `.cover-cortocircuito` en `app/globals.css`, en CSS puro, sin imágenes y con valores en %, diseñada con `/frontend-design` (ver el apartado Portada).
- Entrada `cortocircuito` en `ENGINES` (`lib/engines/index.ts`), con `load` mediante `import()` dinámico, `controls` y `lives: true`.
- Motor provisional `lib/engines/cortocircuito/game.ts` con `createCortocircuitoGame: CreateEngine`. Dibuja una pantalla fija "PRÓXIMAMENTE" en el canvas y cumple el contrato completo. La GJ-02 lo sustituye.
- Leaderboard real sin código propio: detalle y Salón leen la vista `leaderboard`, y el guardado usa `submitScore`.

**Fuera de alcance:**

- El motor jugable: física, plataformas, chispas, pulsos, puntuación, HUD del canvas y overlays (GJ-02).
- Fases con curva de dificultad avanzada, tipos de chispa nuevos, relés, sobrecarga, power-ups y efectos visuales (GJ-03).
- Cambios en `components/game-player.tsx`, `components/game-canvas.tsx` y `lib/engines/types.ts`. El juego usa el HUD fijo (Puntuación, Vidas y Nivel) con `lives: true`, así que no hace falta ampliar la plataforma.
- Cambios en `asteroides` y `tetris`.
- Etiquetas fijas del detalle ("1 JUGADOR"): son correctas para este juego.
- Antitrampas, Realtime y Auth.
- Tests automatizados.

## Modelo de datos

Cambio de esquema: el enum `game_category` gana el valor `PLATAFORMAS`. Va en una migración propia, porque Postgres no permite usar un valor añadido con `ALTER TYPE … ADD VALUE` dentro de la misma transacción en que se crea. La CLI de Supabase aplica cada archivo en una transacción.

Migración 1, `supabase/migrations/<ts1>_add_plataformas_category.sql`:

```sql
-- GJ-01 CORTOCIRCUITO: categoría nueva PLATAFORMAS.
-- Va sola: un valor añadido con ALTER TYPE ... ADD VALUE no se puede usar en la misma
-- transacción, y la fila de `cortocircuito` lo usa en la migración siguiente.
alter type public.game_category add value if not exists 'PLATAFORMAS';
```

Migración 2, `supabase/migrations/<ts2>_add_cortocircuito.sql`, con `<ts2>` posterior a `<ts1>`:

```sql
-- GJ-01 CORTOCIRCUITO: juego de plataformas de pantalla fija, creación propia (game jam).
-- Entrada nueva del catálogo, sin puntuaciones iniciales.
insert into public.games (id, title, short, long, cat, cover, color, sort_order) values (
  'cortocircuito',
  'CORTOCIRCUITO',
  'Golpea las pistas desde abajo y expulsa las chispas aturdidas.',
  'Eres OHM-1, un robot de mantenimiento atrapado en una placa de circuito. Las chispas caen desde los bornes superiores y recorren las pistas. Salta y golpea una pista desde abajo: el pulso de cortocircuito corre por ella hasta el aislante más cercano y aturde a todas las chispas que alcanza. Tócalas antes de que se recarguen para expulsarlas, y encadena expulsiones para multiplicar los puntos. Las chispas que se recuperan o que vuelven a entrar por las tomas de tierra suben de tensión y corren más. Limpia la placa para pasar de fase.',
  'PLATAFORMAS', 'cover-cortocircuito', 'yellow', 3
);
```

`<ts1>` y `<ts2>` son los timestamps que genera `npx supabase migration new`. Si se crean en orden (primero la categoría, después el juego), `<ts1>` queda antes que `<ts2>`.

`sort_order` 3 es el mayor valor vigente tras aplicar todas las migraciones en orden (`asteroides` 1, `tetris` 2, tras `20261105203829_remove_mock_games.sql`) más 1. Con 3 juegos, `cortocircuito` aparece también en la página de inicio, que muestra los 6 primeros.

`lib/games-shared.ts`:

```ts
export const CATS = [
  "TODOS",
  "ARCADE",
  "PUZZLE",
  "SHOOTER",
  "VERSUS",
  "PLATAFORMAS",
] as const satisfies readonly ["TODOS", ...GameCategory[]];
```

El `satisfies` solo compila con `PLATAFORMAS` si antes se ha ejecutado `npm run db:types`.

Registro (`lib/engines/index.ts`), entrada nueva al final:

```ts
cortocircuito: {
  load: () => import("./cortocircuito/game").then((m) => m.createCortocircuitoGame),
  controls: "flechas ← → para moverte, ↑, Espacio o Z para saltar y golpear las pistas desde abajo.",
  lives: true,
},
```

Puntuación: en esta fase el motor provisional siempre notifica 0. La fórmula real está en la GJ-02.

Valores de `GameStats` del motor provisional: `score` = `0`, `lives` = `3`, `level` = `1`. Coinciden con el estado inicial que tendrá el motor real.

Motor provisional (`lib/engines/cortocircuito/game.ts`):

- Pide `canvas.getContext("2d")` y lanza `Error("CORTOCIRCUITO: el navegador no soporta canvas 2D.")` si devuelve `null`.
- Programa un único `requestAnimationFrame`. En ese frame dibuja la pantalla y llama a `onStats({ score: 0, lives: 3, level: 1 })`.
- Pantalla: `setTransform(canvas.width / 800, 0, 0, canvas.height / 600, 0, 0)` y fondo `#0a0a0f`. Encima, `CORTOCIRCUITO` en `bold 44px monospace` `#f5ff00`, centrado en (400, 280), con `shadowBlur` 16 y `shadowColor` `#f5ff00`. Debajo, `PRÓXIMAMENTE` en `18px monospace` `#8a8fb5`, centrado en (400, 330).
- No registra listeners ni bucle continuo.
- `pause()` y `resume()` no hacen nada. `setInputEnabled()` no hace nada.
- `restart()` vuelve a dibujar y notifica `onStats` con el estado inicial.
- `end()` llama a `onGameOver({ score: 0, lives: 3, level: 1 })`.
- `destroy()` cancela el `requestAnimationFrame` pendiente si lo hay.
- Sin estado en variables de módulo y sin `window` ni `document` a nivel de módulo.

Portada `.cover-cortocircuito` (la forma exacta se decide con `/frontend-design`, con valores en %):

- Fondo de placa de circuito: `#0a0a0f`, con una cuadrícula tenue de `repeating-linear-gradient` en `rgba(0, 255, 136, 0.06)` cada 10 % y un resplandor radial amarillo `rgba(245, 255, 0, 0.12)` en la parte inferior.
- `::before` dibuja tres pistas horizontales en verde `#00ff88`, con pads circulares. Una arriba a la izquierda, una central y una abajo a la derecha, con un hueco aislante gris `#4a4f70` en la central.
- `::after` dibuja la escena del giro de diseño:
  - Un robot cian `#00f5ff`, formado por un rectángulo y una antena, golpea la pista central desde abajo.
  - Dos frentes de pulso amarillos `#f5ff00` con `drop-shadow` salen del punto de golpe y se detienen en el aislante.
  - Encima hay dos chispas: una amarilla con forma de estrella, hecha con `clip-path`, y otra aturdida en gris `#8a8fb5`.
- Se distingue a simple vista de `.cover-asteroides` (vectores blancos sobre negro) y de `.cover-tetris` (pozo de bloques).

Archivos nuevos:

```
supabase/migrations/<ts1>_add_plataformas_category.sql
supabase/migrations/<ts2>_add_cortocircuito.sql
lib/engines/cortocircuito/game.ts   // createCortocircuitoGame provisional ("PRÓXIMAMENTE")
```

Archivos modificados:

```
lib/supabase/database.types.ts   // regenerado con npm run db:types (PLATAFORMAS)
lib/games-shared.ts              // PLATAFORMAS en CATS
lib/engines/index.ts             // entrada cortocircuito
app/globals.css                  // .cover-cortocircuito
```

## Plan de implementación

1. Crear la migración de la categoría con `npx supabase migration new add_plataformas_category`, con el `alter type` del apartado Modelo de datos.
2. Crear la migración del juego con `npx supabase migration new add_cortocircuito`, con el `insert` completo. Comprobar que su timestamp es posterior al de la categoría.
3. Aplicar ambas con `npx supabase db push --linked`.
4. Ejecutar `npm run db:types` y comprobar que `lib/supabase/database.types.ts` incluye `"PLATAFORMAS"` en `game_category`, tanto en el tipo como en `Constants`.
5. Añadir `"PLATAFORMAS"` al final de `CATS` en `lib/games-shared.ts`.
6. Crear `.cover-cortocircuito` en `app/globals.css` con `/frontend-design`, con valores en % y respetando el lenguaje visual CRT. Colocarla junto a `.cover-tetris`, con un comentario breve que describa sus capas.
7. Crear `lib/engines/cortocircuito/game.ts` con el motor provisional descrito arriba, siguiendo la estructura de `lib/engines/asteroides/game.ts` (factoría, cierre y objeto de control).
8. Registrar `cortocircuito` en `lib/engines/index.ts` con `import()` dinámico, nunca con import estático.
9. Reconstruir o reiniciar la app: el catálogo está cacheado con el tag `games` y la fila nueva puede no verse en una app ya levantada.
10. Ejecutar `npm run lint` y `npm run build`, y probar a mano `/biblioteca`, `/`, `/salon`, `/juegos/cortocircuito` y `/juegos/cortocircuito/jugar`. Comprobar también que `/juegos/asteroides/jugar` y `/juegos/tetris/jugar` siguen igual.

Antes de escribir código específico de Next o React, leer la guía correspondiente en `node_modules/next/dist/docs/`.

## Criterios de aceptación

Específicos del juego:

- [ ] `lib/supabase/database.types.ts` incluye `"PLATAFORMAS"` en `game_category`, y `CATS` termina en `"PLATAFORMAS"`.
- [ ] La migración de la categoría tiene un timestamp anterior al de la migración del juego, y cada una se aplica sin errores.
- [ ] La fila de `games` tiene exactamente los valores del `insert`: `PLATAFORMAS`, `yellow`, `cover-cortocircuito` y `sort_order` 3.
- [ ] En `/biblioteca` aparece el chip `PLATAFORMAS`, el último de la fila. Al pulsarlo se muestra solo `CORTOCIRCUITO`.
- [ ] Los filtros `SHOOTER` y `PUZZLE` siguen mostrando solo `ASTEROIDES` y `TETRIS`, respectivamente.
- [ ] `ARCADE` y `VERSUS` muestran "NO HAY RESULTADOS".
- [ ] La portada `.cover-cortocircuito` se ve en `/biblioteca`, en `/` y en el detalle: pistas verdes, robot cian, pulso amarillo y chispas, sin huecos vacíos.
- [ ] `/juegos/cortocircuito` muestra `PLATAFORMAS` en las etiquetas del detalle.
- [ ] `/juegos/cortocircuito/jugar` muestra en el canvas "CORTOCIRCUITO" y "PRÓXIMAMENTE", nítidos con `devicePixelRatio` 2.
- [ ] El HUD de React muestra Puntuación 0, Vidas ♥ ♥ ♥ y Nivel 01.
- [ ] El aviso "REQUIERE TECLADO" muestra el texto de `controls` de `cortocircuito`.
- [ ] FIN abre "FIN DEL JUEGO" con puntuación 0. JUGAR DE NUEVO lo cierra y el canvas sigue mostrando "PRÓXIMAMENTE".
- [ ] El motor provisional no registra listeners: tras SALIR, flechas y Espacio hacen scroll con normalidad en otras páginas.
- [ ] `lib/engines/index.ts` carga `cortocircuito` con `import()` dinámico (revisión de código).

Integración con la plataforma:

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `npx supabase db push --linked` no tiene cambios pendientes.
- [ ] `CORTOCIRCUITO` aparece en `/biblioteca` con su portada, en su filtro de categoría y en las pestañas del Salón.
- [ ] `/juegos/cortocircuito` muestra "Partidas" 0, "Mejor global" 0 y "SIN PUNTUACIONES TODAVÍA".
- [ ] `/juegos/cortocircuito/jugar` muestra el canvas dentro del CRT, con la proporción 4:3; a 375 px no hay scroll horizontal.
- [ ] PAUSA y tecla P muestran y quitan "EN PAUSA" sobre el canvas, y cambiar de pestaña lo pausa.
- [ ] Dos montajes seguidos no comparten estado. En Strict Mode no aparecen errores.
- [ ] `asteroides` y `tetris` siguen funcionando igual: mismo HUD (con Vidas en `asteroides`, sin Vidas en `tetris`), mismo aviso de controles y mismo juego.
- [ ] No hay errores de hidratación ni de consola en `/`, `/biblioteca`, `/salon`, `/juegos/cortocircuito` ni `/juegos/cortocircuito/jugar`.

## Decisiones

- **Sí:** id `cortocircuito`, título `CORTOCIRCUITO`, categoría `PLATAFORMAS` y color `yellow`. Son los de la sugerencia de `game-planner` que indicó quien encargó la jam.
- **Sí:** juego de creación propia, sin prototipo en `references/`. Ninguno de `02-asteroids`, `03-tetris` ni `04-arkanoid` es de plataformas.
- **Sí:** categoría nueva `PLATAFORMAS` en vez de reutilizar `ARCADE`. Abre un género que el catálogo no cubre, que es el motivo de la sugerencia.
- **Sí:** dos migraciones (categoría y juego) en lugar de una. Postgres no deja usar un valor de enum recién añadido en la misma transacción. _(supuesto del agente, revisar: que la CLI aplica cada archivo en una única transacción; si no fuese así, sigue siendo la opción segura)_
- **Sí:** `add value if not exists`, para que la migración no falle si el valor ya existiera en el proyecto remoto. _(supuesto del agente, revisar)_
- **Sí:** `sort_order` 3, que es el máximo vigente tras aplicar las migraciones en orden más 1. El seed llegó a usar hasta 10, pero `remove_mock_games` renumeró a 1 y 2. Esto hace que el juego aparezca en la página de inicio. _(supuesto del agente, revisar: si se prefiere un hueco, por ejemplo 10, para reservar posiciones)_
- **Sí:** `PLATAFORMAS` al final de `CATS`. No altera el orden de los chips existentes. _(supuesto del agente, revisar)_
- **Sí:** textos `short` y `long` propuestos, que solo describen mecánicas de la GJ-02 (pulso hasta el aislante, expulsión por contacto, cadena, tensión y tomas de tierra). No mencionan nada de la GJ-03. _(supuesto del agente, revisar)_
- **Sí:** protagonista OHM-1, robot de mantenimiento, y enemigos "chispas", con estética de placa de circuito (pistas verdes, bornes, aislantes y tomas de tierra) en la paleta CRT de Arcade Vault. Evita cualquier personaje, tubería o bloque del género de referencia. _(supuesto del agente, revisar)_
- **Sí:** motor provisional "PRÓXIMAMENTE" en la 01, sustituido por la 02. Así la entrada de `ENGINES` existe desde el principio y el reproductor no cae en la arena decorativa.
- **Sí:** `lives: true` y sin cambios en `GamePlayer`. El juego tiene vidas y nivel (fase), así que el HUD fijo le sirve tal cual.
- **Sí:** texto de `controls` definitivo del MVP ya en la 01, para no tocar el registro dos veces. La GJ-03 lo amplía con la tecla X. _(supuesto del agente, revisar: teclas ↑, Espacio y Z para saltar)_
- **No:** `ARCADE` como categoría. Ahorraría el `ALTER TYPE`, pero dejaría PLATAFORMAS sin abrir.
- **No:** mezclar el diseño con `torre-pulso`, también PLATAFORMAS. Aquel es una subida vertical infinita con plataformas rítmicas; este es de pantalla fija y combate desde abajo. Ningún elemento se comparte.

## Riesgos

| Riesgo                                                                                            | Mitigación                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Usar `PLATAFORMAS` en la misma migración que lo añade hace fallar el `db push`                    | Dos migraciones: la de la categoría va primero, con timestamp anterior, y el plan lo comprueba.                                                                                                   |
| Olvidar `npm run db:types` o la entrada en `CATS`: compila igual y el chip no aparece             | El `satisfies` de `CATS` falla si `PLATAFORMAS` no está en los tipos. Hay criterios para el chip y para los tipos.                                                                                |
| Un valor de enum añadido no se puede eliminar con una migración simple                            | Revisar la spec antes de aplicar. Revertirlo exigiría recrear el tipo, así que no se aplica en un proyecto compartido sin aprobación.                                                             |
| Guardar una partida del motor provisional deja una fila con 0 puntos que la API no permite borrar | No guardar durante las pruebas de la 01. Si ocurre, borrar la fila desde el panel de Supabase antes de la GJ-02, cuyo criterio exige "SIN PUNTUACIONES TODAVÍA".                                  |
| `/juegos/cortocircuito` da 404 en una app ya levantada                                            | El catálogo está cacheado con el tag `games`: reconstruir o reiniciar tras aplicar las migraciones. `npm run build` consulta Supabase, así que hay que aplicar las migraciones antes de compilar. |
| `cover-cortocircuito` mal escrita deja la portada vacía sin error                                 | Criterio de portada visible en `/biblioteca`, `/` y el detalle.                                                                                                                                   |
| El chip `PLATAFORMAS` es más largo que los demás y descuadra la fila de filtros en móvil          | Comprobar a 375 px. `.av-chips` ya admite varias filas; si no fuese así, se ajusta en esta spec con `/frontend-design`.                                                                           |
| Un import estático del motor en `ENGINES` mete su código en todos los reproductores               | `load` con `import()` dinámico y un criterio de revisión de código.                                                                                                                               |

## Lo que **no** entra en esta spec

- Motor jugable de CORTOCIRCUITO (GJ-02).
- Progresión, tipos de chispa nuevos, relés, sobrecarga, power-ups y efectos (GJ-03).
- Cambios en `GamePlayer`, `GameCanvas` y el contrato de motores.
- Cambios en `asteroides` y `tetris`.
- Antitrampas, Realtime y Auth.

Cada uno, si llega, va en su propia spec.
