# Juegos con skins

Registro de los juegos con motor que ya tienen las skins **CLÁSICO** (por defecto), **NEÓN** y **RETRO**. Lo mantiene el agente `skin-designer`, que trabaja con **un solo juego por invocación**: el que indique el usuario.

Leyenda: ✅ implementada y con contraste verificado · ⚠️ implementada con avisos de contraste · ❌ pendiente.

## Infraestructura común

| Pieza                                                          | Estado | Fecha      |
| -------------------------------------------------------------- | ------ | ---------- |
| `lib/engines/skins.ts` (`SkinId`, `DEFAULT_SKIN`)              | ✅     | 2026-11-06 |
| `GameEngine.setSkin()` en `lib/engines/types.ts`               | ✅     | 2026-11-06 |
| Hook `useSkin(gameId)` en `lib/skins.ts`                       | ✅     | 2026-11-06 |
| Selector de skins en `components/game-player.tsx`              | ✅     | 2026-11-06 |
| Sección "Skins" en `.claude/skills/nuevo-juego/integracion.md` | ✅     | 2026-11-06 |

## Juegos

| ID           | Título     | CLÁSICO | NEÓN | RETRO | Paletas (NEÓN / RETRO)                 | Fecha      | Notas                                                                                                                                                                       |
| ------------ | ---------- | ------- | ---- | ----- | -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `asteroides` | ASTEROIDES | ✅      | ✅   | ✅    | cian/magenta/amarillo · ámbar 4 tonos  | 2026-11-06 | Peor contraste: NEÓN asteroides y GAME OVER magenta 5.15:1; RETRO asteroides y subtítulo 6.60:1. RETRO: nave rellena, asteroides con relleno oscuro y trazos al doble de grosor. |
| `tetris`     | TETRIS     | ⚠️      | ✅   | ✅    | tokens + violeta/azul/naranja/plata · verde fósforo 4 tonos | 2026-11-06 | CLÁSICO conserva el original con avisos: fondo del tablero `#1a1a25` más claro que `--bg-3`, etiquetas `#555570` 2.65:1, borde del tablero 1.22:1, GAME OVER sobre pieza amarilla 3.59:1 y puntuación 4.26:1. NEÓN: bloques en tubo (relleno 22 % + trazo con glow 8), peor pieza magenta 4.93:1. RETRO: piezas por luminosidad y patrón (macizo, punto, marco, franjas, hueco); peor pieza `#2e8b3a` 4.30:1. |
