// Paletas de TETRIS. CLÁSICO reproduce exactamente los colores del prototipo (tema oscuro de
// references/03-tetris); NEÓN usa los tokens de la plataforma con bloques en tubo y resplandor;
// RETRO es un fósforo verde de cuatro tonos sin resplandor, donde las piezas se distinguen por
// luminosidad y por patrón. Contrastes WCAG calculados (ver references/game-with-themes.md).
import type { SkinId } from "../skins";
// Marca dibujada dentro de cada bloque. "hollow" no rellena: solo el contorno con el color.
export type BlockPattern = "solid" | "dot" | "frame" | "stripes" | "hollow";
export interface PieceStyle {
  color: string;
  pattern: BlockPattern;
}
// Un estilo por tipo de pieza, en el orden de board.ts: I, O, T, S, Z, J, L, N (tuerca).
export type PieceStyles = readonly [
  PieceStyle,
  PieceStyle,
  PieceStyle,
  PieceStyle,
  PieceStyle,
  PieceStyle,
  PieceStyle,
  PieceStyle,
];
export interface TetrisPalette {
  background: string; // fondo del canvas fuera del tablero
  boardBg: string; // fondo del tablero y de la caja NEXT
  grid: string; // rejilla del tablero
  border: string; // borde del tablero y de la caja NEXT
  borderWidth: number;
  borderGlow: number; // shadowBlur del borde del tablero; 0 = sin resplandor
  title: string; // "TETRIS"
  titleGlowColor: string;
  titleGlow: number;
  label: string; // SCORE, LINES, LEVEL, NEXT, CONTROLS
  value: string; // valores del panel
  controls: string; // texto de los controles
  kbdBg: string;
  kbdBorder: string;
  kbdText: string;
  pieces: PieceStyles;
  blockFillAlpha: number; // opacidad del relleno de los bloques (1 = macizo)
  blockStroke: number; // grosor del contorno de los bloques; 0 = sin contorno
  blockGlow: number; // shadowBlur del contorno de los bloques; 0 = sin resplandor
  blockHighlight: string | null; // brillo superior de los bloques (null: relleno plano)
  blockMark: string; // color de las marcas de patrón (dot, frame, stripes)
  overlay: string; // velo del fin de partida
  overlayTitle: string; // "GAME OVER"
  overlayText: string; // línea de puntuación del overlay
  overlayGlow: number; // shadowBlur de "GAME OVER"; 0 = sin resplandor
}
const solid = (color: string): PieceStyle => ({ color, pattern: "solid" });
export const SKINS: Record<SkinId, TetrisPalette> = {
  clasico: {
    background: "#0f0f17",
    boardBg: "#1a1a25",
    grid: "#22222e",
    border: "#2a2a3a",
    borderWidth: 1,
    borderGlow: 0,
    title: "#7aa2f7",
    titleGlowColor: "rgba(122,162,247,0.5)",
    titleGlow: 20,
    label: "#555570",
    value: "#7aa2f7",
    controls: "#888",
    kbdBg: "#22223a",
    kbdBorder: "#3a3a5a",
    kbdText: "#aaa",
    pieces: [
      solid("#4dd0e1"), // I - cian
      solid("#ffd54f"), // O - amarillo
      solid("#ba68c8"), // T - morado
      solid("#81c784"), // S - verde
      solid("#e57373"), // Z - rojo
      solid("#90caf9"), // J - azul pálido
      solid("#ffb74d"), // L - naranja
      solid("#9e9e9e"), // N - tuerca (gris metálico)
    ],
    blockFillAlpha: 1,
    blockStroke: 0,
    blockGlow: 0,
    blockHighlight: "rgba(255,255,255,0.12)",
    blockMark: "#1a1a25",
    overlay: "rgba(10,10,20,0.75)",
    overlayTitle: "#e57373",
    overlayText: "#7aa2f7",
    overlayGlow: 0,
  },
  neon: {
    background: "#0a0a0f",
    boardBg: "#10101a",
    grid: "#181826",
    border: "#ff006e",
    borderWidth: 2,
    borderGlow: 10,
    title: "#00f5ff",
    titleGlowColor: "#00f5ff",
    titleGlow: 14,
    label: "#8a8fb5",
    value: "#00f5ff",
    controls: "#8a8fb5",
    kbdBg: "#15151f",
    kbdBorder: "#2a2a40",
    kbdText: "#e6e9ff",
    pieces: [
      solid("#00f5ff"), // I - cian
      solid("#f5ff00"), // O - amarillo
      solid("#b14dff"), // T - violeta
      solid("#00ff88"), // S - verde
      solid("#ff006e"), // Z - magenta
      solid("#3d8bff"), // J - azul
      solid("#ff8c1a"), // L - naranja
      solid("#c8cce8"), // N - tuerca (plata)
    ],
    blockFillAlpha: 0.22,
    blockStroke: 2,
    blockGlow: 8,
    blockHighlight: null,
    blockMark: "#10101a",
    overlay: "rgba(10,10,15,0.85)",
    overlayTitle: "#f5ff00",
    overlayText: "#00f5ff",
    overlayGlow: 12,
  },
  retro: {
    background: "#050d04",
    boardBg: "#0a1609",
    grid: "#10230d",
    border: "#3fa34d",
    borderWidth: 2,
    borderGlow: 0,
    title: "#e0ffd0",
    titleGlowColor: "#e0ffd0",
    titleGlow: 0,
    label: "#3fa34d",
    value: "#6fdc5a",
    controls: "#3fa34d",
    kbdBg: "#0f220c",
    kbdBorder: "#2e8b3a",
    kbdText: "#6fdc5a",
    pieces: [
      { color: "#e0ffd0", pattern: "solid" }, // I - claro macizo
      { color: "#6fdc5a", pattern: "solid" }, // O - medio macizo
      { color: "#2e8b3a", pattern: "solid" }, // T - oscuro macizo
      { color: "#6fdc5a", pattern: "dot" }, // S - medio con punto
      { color: "#2e8b3a", pattern: "dot" }, // Z - oscuro con punto
      { color: "#e0ffd0", pattern: "frame" }, // J - claro con marco interior
      { color: "#6fdc5a", pattern: "stripes" }, // L - medio con franjas
      { color: "#e0ffd0", pattern: "hollow" }, // N - tuerca: claro hueco
    ],
    blockFillAlpha: 1,
    blockStroke: 0,
    blockGlow: 0,
    blockHighlight: null,
    blockMark: "#0a1609",
    overlay: "rgba(5,13,4,0.85)",
    overlayTitle: "#e0ffd0",
    overlayText: "#6fdc5a",
    overlayGlow: 0,
  },
};
