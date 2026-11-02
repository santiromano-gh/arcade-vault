// Registro id de juego → motor y metadatos. Los juegos sin motor mantienen la arena decorativa.
import { createAsteroidesGame } from "./asteroides/game";
import { createTetrisGame } from "./tetris/game";
import type { EngineEntry } from "./types";
export const ENGINES: Partial<Record<string, EngineEntry>> = {
  asteroides: {
    create: createAsteroidesGame,
    controls: "flechas para rotar y propulsar, Espacio para disparar.",
    lives: true,
  },
  tetris: {
    create: createTetrisGame,
    controls: "flechas ← → para mover y ↓ para bajar, ↑ o X para rotar, Espacio para soltar.",
    lives: false,
  },
};
