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
| `rebote-neon` | REBOTE NEÓN | ✅ | ✅ | ✅ | tokens + violeta/naranja/lavanda · 8-bit plana 7 tonos | 2026-11-06 | Nace con skins (SPEC 08). CLÁSICO: tonos visibles del spritesheet sobre `#000`; peor bloque violeta `#6e46d2` 3.47:1, gris 4.16:1 y rojo 4.19:1; textos `#fff` 21:1. NEÓN (`#0a0a0f`): bloques en tubo (relleno 22 % + contorno con glow 10); peor bloque y extremos de la paleta `#ff006e` 5.15:1; textos 14.58:1. RETRO (`#101018`): sin resplandor y trazos al doble; bloques también por patrón (macizo, punto, franjas, damero); peor bloque y extremos `#e04848` 4.68:1; textos 11.35:1. |
