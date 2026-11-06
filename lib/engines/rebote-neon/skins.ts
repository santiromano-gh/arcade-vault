// Paletas de REBOTE NEÓN. CLÁSICO reproduce los tonos que se ven en el spritesheet del prototipo
// (references/04-arkanoid/assets/spritesheet-breakout.png), no los nombres de spritesheet.js;
// NEÓN usa los tokens de la plataforma con bloques en tubo y resplandor; RETRO es una paleta
// 8-bit plana sin resplandor en la que los bloques se distinguen también por patrón.
// Contrastes WCAG calculados contra `background` (ver references/game-with-themes.md).
import type { SkinId } from "../skins";
import type { BlockColor } from "./levels";
// Marca dibujada dentro de cada bloque, en `blockBorder`.
export type BlockPattern = "solid" | "dot" | "stripes" | "checker";
export interface ReboteNeonPalette {
  background: string;
  blocks: Record<BlockColor, string>; // tono de cada color lógico del prototipo
  blockPatterns: Record<BlockColor, BlockPattern>;
  blockFillAlpha: number; // opacidad del relleno de los bloques (1 = macizo)
  blockBorder: string; // contorno del bloque y color de su patrón
  blockHighlight: string; // franja de brillo superior del bloque
  paddle: string;
  paddleEnds: string; // extremos de la paleta
  ball: string;
  text: string; // aviso de saque y GAME OVER
  textAccent: string; // indicador VOLTAJE ×N
  overlayVeil: string; // velo bajo el aviso de saque y GAME OVER
  glow: number; // shadowBlur de los trazos; 0 = sin resplandor
  lineScale: number; // multiplicador del grosor de los trazos
}
const SOLID: Record<BlockColor, BlockPattern> = {
  gray: "solid",
  red: "solid",
  yellow: "solid",
  cyan: "solid",
  magenta: "solid",
  hotpink: "solid",
  green: "solid",
};
export const SKINS: Record<SkinId, ReboteNeonPalette> = {
  clasico: {
    background: "#000",
    blocks: {
      red: "#c83c46",
      cyan: "#3cc39b",
      green: "#3c91e1",
      magenta: "#6e46d2",
      yellow: "#e6b446",
      hotpink: "#f0821e",
      gray: "#6e6e78",
    },
    blockPatterns: SOLID,
    blockFillAlpha: 1,
    blockBorder: "rgba(0, 0, 0, 0.45)",
    blockHighlight: "rgba(255, 255, 255, 0.28)",
    paddle: "#d2d2dc",
    paddleEnds: "#dc3c46",
    ball: "#c8c8d2",
    text: "#fff",
    textAccent: "#fff",
    overlayVeil: "rgba(0, 0, 0, 0.6)",
    glow: 0,
    lineScale: 1,
  },
  neon: {
    background: "#0a0a0f",
    blocks: {
      red: "#ff006e",
      cyan: "#00f5ff",
      green: "#00ff88",
      magenta: "#b967ff",
      yellow: "#f5ff00",
      hotpink: "#ff8a00",
      gray: "#8a8fb5",
    },
    blockPatterns: SOLID,
    blockFillAlpha: 0.22,
    blockBorder: "rgba(10, 10, 15, 0.6)",
    blockHighlight: "rgba(255, 255, 255, 0.12)",
    paddle: "#00f5ff",
    paddleEnds: "#ff006e",
    ball: "#f5ff00",
    text: "#00f5ff",
    textAccent: "#f5ff00",
    overlayVeil: "rgba(10, 10, 15, 0.65)",
    glow: 10,
    lineScale: 1.5,
  },
  retro: {
    background: "#101018",
    blocks: {
      red: "#e04848",
      cyan: "#58d8f8",
      green: "#58d854",
      magenta: "#b07cf8",
      yellow: "#f8d838",
      hotpink: "#f89038",
      gray: "#a8a8b0",
    },
    blockPatterns: {
      red: "solid",
      cyan: "dot",
      green: "stripes",
      magenta: "dot",
      yellow: "solid",
      hotpink: "stripes",
      gray: "checker",
    },
    blockFillAlpha: 1,
    blockBorder: "#101018",
    blockHighlight: "rgba(248, 248, 248, 0.35)",
    paddle: "#f8f8f8",
    paddleEnds: "#e04848",
    ball: "#f8f8f8",
    text: "#f8d838",
    textAccent: "#58d8f8",
    overlayVeil: "rgba(16, 16, 24, 0.7)",
    glow: 0,
    lineScale: 2,
  },
};
