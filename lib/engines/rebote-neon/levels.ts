// Constantes y muros de REBOTE NEÓN, portados de references/04-arkanoid (game.js y levels.js).
// Solo datos: sin estado de módulo ni acceso a document o window, porque el registro de motores
// también se evalúa en el servidor. La velocidad de cada nivel sale de levelSpeedMultiplier, no
// del campo `speed` del prototipo.
export const W = 800;
export const H = 600;
export const PADDLE_W = 81;
export const PADDLE_H = 14;
export const PADDLE_Y = 560;
export const PADDLE_SPEED = 400; // px/s con las flechas
export const BALL_SIZE = 16;
export const BLOCK_COLS = 10;
export const BLOCK_ROWS = 6;
export const BLOCK_W = 64;
export const BLOCK_H = 24;
export const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2; // 80
export const BLOCKS_ORIGIN_Y = 80;
// Dirección y módulo del saque del prototipo: (200, -300), ≈ 360,6 px/s.
export const BASE_BALL_VX = 200;
export const BASE_BALL_VY = -300;
export const BASE_BALL_SPEED = Math.hypot(BASE_BALL_VX, BASE_BALL_VY);
export const MAX_BOUNCE_ANGLE = Math.PI / 3; // 60° respecto a la vertical en los extremos de la paleta
export const MAX_SPEED_MULTIPLIER = 2;
export const MAX_SUBSTEP = 8; // px máximos que avanza la pelota en cada subpaso
export const MAX_VOLTAGE = 5;
export const POINTS_PER_BLOCK = 10;
export const MAX_SCORE = 10_000_000;
export const START_LIVES = 3;
export const EXPLOSION_DURATION = 150; // ms
export const EXPLOSION_STEPS = 4;
// Colores lógicos del prototipo: cada skin los traduce a un tono.
export type BlockColor = "gray" | "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green";
export const BLOCK_COLORS: readonly BlockColor[] = [
  "gray",
  "red",
  "yellow",
  "cyan",
  "magenta",
  "hotpink",
  "green",
];
export interface LevelBlock {
  col: number;
  row: number;
  color: BlockColor;
}
type Pattern = readonly LevelBlock[];
function grid(pick: (col: number, row: number) => BlockColor | null): Pattern {
  const blocks: LevelBlock[] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++) {
      const color = pick(col, row);
      if (color) blocks.push({ col, row, color });
    }
  return blocks;
}
const ROW_COLORS_1: readonly BlockColor[] = [
  "red",
  "yellow",
  "cyan",
  "magenta",
  "hotpink",
  "green",
];
const ROW_COLORS_2: readonly BlockColor[] = [
  "gray",
  "cyan",
  "hotpink",
  "yellow",
  "magenta",
  "green",
];
const ROW_COLORS_4: readonly BlockColor[] = [
  "cyan",
  "magenta",
  "green",
  "yellow",
  "hotpink",
  "red",
];
const PYRAMID_START = [4, 3, 2, 1, 0, 0];
const PYRAMID_END = [5, 6, 7, 8, 9, 9];
const GAPS_4: readonly (readonly number[])[] = [
  [2, 5, 8],
  [0, 4, 7, 9],
  [1, 3, 6],
  [2, 5, 8, 9],
  [0, 4, 7],
  [1, 3, 6, 9],
];
// Los 5 muros de levels.js: el nivel n usa LEVELS[(n - 1) % 5].
export const LEVELS: readonly Pattern[] = [
  // 1: muro completo con un color por fila.
  grid((_col, row) => ROW_COLORS_1[row]),
  // 2: pirámide.
  grid((col, row) =>
    col >= PYRAMID_START[row] && col <= PYRAMID_END[row] ? ROW_COLORS_2[row] : null,
  ),
  // 3: tablero de ajedrez.
  grid((col, row) => ((col + row) % 2 === 0 ? (row < 3 ? "yellow" : "magenta") : null)),
  // 4: muro con huecos.
  grid((col, row) => (GAPS_4[row].includes(col) ? null : ROW_COLORS_4[row])),
  // 5: marco con cruz.
  grid((col, row) => {
    const isFrame = col === 0 || col === BLOCK_COLS - 1 || row === 0 || row === BLOCK_ROWS - 1;
    const isCross = col === 4 || row === 2;
    if (!isFrame && !isCross) return null;
    return isCross && !isFrame ? "hotpink" : "cyan";
  }),
];
export function levelPattern(level: number): Pattern {
  return LEVELS[(level - 1) % LEVELS.length];
}
// ×1,1 por nivel hasta el tope ×2,0 (nivel 9).
export function levelSpeedMultiplier(level: number): number {
  return Math.min(1.1 ** (level - 1), MAX_SPEED_MULTIPLIER);
}
