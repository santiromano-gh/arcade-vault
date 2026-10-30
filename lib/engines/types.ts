// Contrato entre los motores de juego (canvas) y React.
export interface GameStats {
  score: number;
  lives: number;
  level: number;
}
export interface EngineCallbacks {
  // Solo cuando cambia algún valor, nunca en cada frame.
  onStats(stats: GameStats): void;
  onGameOver(stats: GameStats): void;
}
export interface GameEngine {
  pause(): void;
  resume(): void;
  restart(): void; // partida nueva: 0 puntos, 3 vidas, nivel 1
  end(): void; // fuerza el fin de partida y dispara onGameOver
  setInputEnabled(enabled: boolean): void; // false mientras el modal de React está abierto
  destroy(): void; // cancela requestAnimationFrame y quita los listeners
}
export type CreateEngine = (canvas: HTMLCanvasElement, callbacks: EngineCallbacks) => GameEngine;
