# Integración de un juego en Arcade Vault

Referencia del estado de la plataforma. Si algo difiere del código, manda el código.

## Contrato

- `lib/engines/types.ts`: `CreateEngine`, `GameEngine`, `EngineCallbacks` y `GameStats`.
- `lib/engines/index.ts`: registro `ENGINES`, de `game.id` a motor. Cada entrada declara `load: () => import("./<id>/game").then((m) => m.create<Nombre>Game)`: el motor se descarga bajo demanda, nunca con import estático.
- `lib/engines/asteroides/game.ts`: modelo a seguir (estado en un cierre, `notify`, `start`, `stop`, `pause`, `destroy`).

La plataforma ya resuelve, y el motor no debe duplicar:

- `components/game-canvas.tsx`: buffer con `devicePixelRatio` y ciclo de vida compatible con Strict Mode.
- `components/game-player.tsx`: pausa, tecla P, `visibilitychange`, FIN, SALIR, modal y guardado con `submitScore`.

## Skins

Cada juego ofrece tres skins: **CLÁSICO** (predeterminada), **NEÓN** y **RETRO**. Las aplica el agente `skin-designer` juego a juego; el estado está en `references/game-with-themes.md`. **Todo motor nuevo debe incluir `lib/engines/<id>/skins.ts` con las tres skins desde el primer día.**

- `lib/engines/skins.ts`: `SkinId` (`"clasico" | "neon" | "retro"`), `SKIN_IDS`, `DEFAULT_SKIN` (`"clasico"`), `SKIN_LABELS` e `isSkinId()`. Sin `window` a nivel de módulo.
- `lib/engines/types.ts`: `GameEngine.setSkin?(skin)` y `EngineEntry.skins?` son opcionales para que los motores sin skins sigan compilando. Un juego con skins declara `skins: true` en `ENGINES` e implementa `setSkin`.
- `lib/engines/<id>/skins.ts`: un tipo `<Nombre>Palette` con **todos** los colores del dibujo (fondo, entidades, HUD y textos del canvas, overlays, efectos) y `export const SKINS: Record<SkinId, <Nombre>Palette>`. El `Record` obliga a definir las tres.
- El motor guarda la paleta activa en su cierre (`let palette = SKINS[DEFAULT_SKIN]`). `setSkin` la sustituye y, si el bucle está detenido (pausa), dibuja un frame. Nunca reinicia la partida ni toca puntuación, físicas o controles.
- Ningún color literal en el código de dibujo. Las diferencias entre skins son datos de la paleta (`glow` para `shadowBlur`, rellenos opcionales, multiplicador de grosor), no `if (skin === …)`. Tras cada trazo con resplandor, `shadowBlur = 0`.
- CLÁSICO copia exactamente el aspecto original. NEÓN usa los tokens de la plataforma (`#00f5ff`, `#ff006e`, `#f5ff00`, `#00ff88`) sobre `#0a0a0f` con resplandor de 6 a 16. RETRO es una paleta limitada (fósforo u 8-bit) sin resplandor.
- Modo oscuro (contraste WCAG calculado): fondo con luminancia ≤ la de `--bg-3` (`#15151f`), textos y HUD del canvas ≥ 4.5:1, elementos de juego ≥ 3:1, elementos que deben distinguirse con tonos claramente distintos (en RETRO monocromo, por luminosidad, relleno o borde).
- `lib/skins.ts`: hook `useSkin(gameId)` con `localStorage` (clave `av_skin_<gameId>`); valor ausente o inválido → `DEFAULT_SKIN`.
- `components/game-player.tsx`: muestra el selector solo si `entry.skins === true`, aplica la skin en `onEngine` y en un efecto, y quita el foco del botón tras el clic para no robar el teclado al juego.

## Reglas de datos

- `games.id` debe coincidir con la clave de `ENGINES`. Sin fila en `games`, `/juegos/<id>/jugar` da 404 y no se puede guardar.
- Cada juego nuevo lleva su propia migración. El seed ya está aplicado: no se edita.
- `sort_order` es `unique`. Inicio solo muestra los 6 primeros, así que un juego con posición mayor no aparece ahí.
- `score` debe ser un entero entre 0 y 10.000.000. Lo validan `submitScore`, el CHECK de la tabla y RLS. Un valor decimal hace fallar el guardado.
- El nombre del jugador lo normaliza la plataforma.
- El motor nunca habla con Supabase. Solo notifica a React.
- `cover` es texto libre: una clase mal escrita deja la portada vacía sin ningún error.
- `color` es el enum `game_color`: `cyan`, `magenta`, `yellow`, `green`.
- `cat` es el enum `game_category`. Una categoría nueva exige `ALTER TYPE`, `npm run db:types` y añadirla a `CATS` en `lib/games-shared.ts`. Si se olvida, compila igual.
- `submitScore` solo invalida el tag `scores`. Una fila nueva en `games` puede no verse en una app ya levantada hasta reconstruir o reiniciar.
- `npm run build` consulta Supabase: aplica la migración antes de compilar.

## Trampas de portado

- **Módulo evaluado en servidor.** `ENGINES` se importa desde un componente que también se renderiza en servidor. No uses `document`, `window` ni `new Audio()` a nivel de módulo: van dentro de la factoría.
- **Tamaño lógico.** `canvas.width` incluye el `devicePixelRatio`. Usa las constantes lógicas para físicas, dibujo y escala del ratón (`W / rect.width`).
- **Listeners.** Retira en `destroy()` todos los listeners, también los registrados en el canvas.
- **Teclas duplicadas.** Quita del motor P y Escape: la pausa es de React.
- **Autorrepetición.** El `justPressed` de `asteroides` la ignora. No lo copies en juegos que dependen del `keydown` repetido, como Tetris.
- **Tiempo.** Limita `dt` a 50 ms y reinicia la marca de tiempo al reanudar.
- **Puntuación.** Aplica `Math.floor` si la fórmula puede producir decimales.
- **Assets.** Van en `public/` y se cargan con ruta absoluta. `destroy()` puede llegar antes de que terminen de cargar.
- **DOM del prototipo.** El HUD, los overlays y los menús deben pasar al canvas o al HUD de React. La pausa de la plataforma congela el bucle y tapa el canvas, así que un menú dentro de la pausa no funciona.
- **Estado.** Nada de estado de partida en variables de módulo.

## Límites de la plataforma

Cada uno exige una ampliación si el juego lo necesita:

| Límite                                    | Dónde está                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| Resolución lógica 800×600                 | `components/game-canvas.tsx`, `lib/engines/asteroides/entities.ts`               |
| Proporción 4:3                            | `.crt-screen` y `.game-canvas` en `app/globals.css`                              |
| `lives` obligatorio                       | `lib/engines/types.ts`, `components/game-player.tsx`                             |
| HUD fijo: Puntuación, Vidas y Nivel       | `components/game-player.tsx`                                                     |
| Texto de controles y "REQUIERE TECLADO"   | `components/game-player.tsx`                                                     |
| Etiquetas fijas del detalle ("1 JUGADOR") | `app/juegos/[id]/page.tsx`                                                       |
| Comentario "3 vidas, nivel 1"             | `restart()` en `lib/engines/types.ts`                                            |

## Particularidades de `references/`

- `03-tetris`: dos canvas (tablero 300×600 y siguiente pieza), HUD y overlay en DOM, sin vidas, tema claro/oscuro con `localStorage`, y depende de la autorrepetición de teclas.
- `04-arkanoid`: canvas 800×600, ratón y teclado, spritesheet PNG y MP3, estado de victoria, y selector de nivel dentro de la pausa.
