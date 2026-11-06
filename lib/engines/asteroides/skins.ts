// Paletas de ASTEROIDES. CLÁSICO reproduce exactamente los colores del prototipo; NEÓN usa los
// tokens de la plataforma con resplandor y RETRO es un fósforo ámbar de cuatro tonos sin
// resplandor. Contrastes WCAG calculados contra `background` (ver references/game-with-themes.md).
import type { SkinId } from "../skins";
export interface AsteroidesPalette {
  background: string;
  ship: string; // contorno de la nave
  shipFill: string | null; // relleno plano de la nave (null: solo contorno)
  thrust: string; // llama del propulsor
  bullet: string;
  asteroid: string; // contorno de los asteroides
  asteroidFill: string | null; // relleno plano de los asteroides (null: solo contorno)
  powerUp: string; // rombo y texto "3x"
  particle: string; // explosiones; la opacidad la pone el motor según la vida de la partícula
  hud: string; // puntuación, nivel e iconos de vida
  hudAccent: string; // contador del triple disparo
  overlayTitle: string; // "GAME OVER"
  overlaySub: string; // línea secundaria del overlay
  glow: number; // shadowBlur de los trazos; 0 = sin resplandor
  lineScale: number; // multiplicador del grosor de los trazos
}
export const SKINS: Record<SkinId, AsteroidesPalette> = {
  clasico: {
    background: "#000",
    ship: "#fff",
    shipFill: null,
    thrust: "rgba(255, 130, 0, 0.85)",
    bullet: "#fff",
    asteroid: "#fff",
    asteroidFill: null,
    powerUp: "#0ff",
    particle: "#fff",
    hud: "#fff",
    hudAccent: "#0ff",
    overlayTitle: "#fff",
    overlaySub: "rgba(255,255,255,0.65)",
    glow: 0,
    lineScale: 1,
  },
  neon: {
    background: "#0a0a0f",
    ship: "#00f5ff",
    shipFill: null,
    thrust: "rgba(245, 255, 0, 0.85)",
    bullet: "#f5ff00",
    asteroid: "#ff006e",
    asteroidFill: null,
    powerUp: "#00ff88",
    particle: "#ff006e",
    hud: "#00f5ff",
    hudAccent: "#00ff88",
    overlayTitle: "#ff006e",
    overlaySub: "#8a8fb5",
    glow: 10,
    lineScale: 1,
  },
  retro: {
    background: "#120c02",
    ship: "#ffb000",
    shipFill: "#ffb000",
    thrust: "#c98a00",
    bullet: "#ffe4a8",
    asteroid: "#c98a00",
    asteroidFill: "#3a2806",
    powerUp: "#ffe4a8",
    particle: "#ffb000",
    hud: "#ffb000",
    hudAccent: "#ffe4a8",
    overlayTitle: "#ffe4a8",
    overlaySub: "#c98a00",
    glow: 0,
    lineScale: 2,
  },
};
