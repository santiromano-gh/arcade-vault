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
  restart(): void; // partida nueva con el estado inicial del juego
  end(): void; // fuerza el fin de partida y dispara onGameOver
  setInputEnabled(enabled: boolean): void; // false mientras el modal de React está abierto
  destroy(): void; // cancela requestAnimationFrame y quita los listeners
}
export type CreateEngine = (canvas: HTMLCanvasElement, callbacks: EngineCallbacks) => GameEngine;
// Entrada del registro: el motor y los metadatos que GamePlayer necesita para adaptar su HUD.
export interface EngineEntry {
  load(): Promise<CreateEngine>; // import() dinámico del motor: se descarga bajo demanda
  controls: string; // texto del aviso "REQUIERE TECLADO", tras "Conecta uno para jugar:"
  lives: boolean; // false: GamePlayer oculta el indicador "Vidas"
}
