// Registro id de juego → motor. Los juegos sin motor mantienen la arena decorativa.
import { createAsteroidesGame } from "./asteroides/game";
import type { CreateEngine } from "./types";
export const ENGINES: Partial<Record<string, CreateEngine>> = {
  asteroides: createAsteroidesGame,
};
