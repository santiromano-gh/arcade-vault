# Juegos con skins

Registro de los juegos con motor que ya tienen las skins **CLÁSICO** (por defecto), **NEÓN** y **RETRO**. Lo mantiene el agente `skin-designer`, que trabaja con **un solo juego por invocación**: el que indique el usuario.

Leyenda: ✅ implementada y con contraste verificado · ⚠️ implementada con avisos de contraste · ❌ pendiente.

## Infraestructura común

| Pieza                                                      | Estado | Fecha |
| ---------------------------------------------------------- | ------ | ----- |
| `lib/engines/skins.ts` (`SkinId`, `DEFAULT_SKIN`)          | ❌     | —     |
| `GameEngine.setSkin()` en `lib/engines/types.ts`           | ❌     | —     |
| Hook `useSkin(gameId)` en `lib/skins.ts`                   | ❌     | —     |
| Selector de skins en `components/game-player.tsx`          | ❌     | —     |
| Sección "Skins" en `.claude/skills/nuevo-juego/integracion.md` | ❌     | —     |

## Juegos

| ID           | Título     | CLÁSICO | NEÓN | RETRO | Paletas (NEÓN / RETRO) | Fecha | Notas                        |
| ------------ | ---------- | ------- | ---- | ----- | ---------------------- | ----- | ---------------------------- |
| `asteroides` | ASTEROIDES | ❌      | ❌   | ❌    | —                      | —     | Colores fijos en el motor.   |
| `tetris`     | TETRIS     | ❌      | ❌   | ❌    | —                      | —     | Colores fijos en el motor.   |
