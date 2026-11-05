// Registro id de juego → motor y metadatos. Los juegos sin motor mantienen la arena decorativa.
// Cada motor se importa con import() dinámico: el bundle de un juego no incluye los demás
// y el código del motor solo se descarga al abrir su reproductor.
import type { EngineEntry } from "./types";
export const ENGINES: Partial<Record<string, EngineEntry>> = {
  asteroides: {
    load: () => import("./asteroides/game").then((m) => m.createAsteroidesGame),
    controls: "flechas para rotar y propulsar, Espacio para disparar.",
    lives: true,
  },
  tetris: {
    load: () => import("./tetris/game").then((m) => m.createTetrisGame),
    controls: "flechas ← → para mover y ↓ para bajar, ↑ o X para rotar, Espacio para soltar.",
    lives: false,
  },
};
