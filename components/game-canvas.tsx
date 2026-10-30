"use client";
import { useEffect, useEffectEvent, useRef } from "react";
import type { CreateEngine, GameEngine, GameStats } from "@/lib/engines/types";
// Resolución lógica fija de los motores; el CSS la escala al ancho de la pantalla CRT.
const LOGICAL_W = 800;
const LOGICAL_H = 600;
interface GameCanvasProps {
  createEngine: CreateEngine;
  title: string;
  // Recibe el controlador al crearse el motor y null al destruirlo.
  onEngine(engine: GameEngine | null): void;
  onStats(stats: GameStats): void;
  onGameOver(stats: GameStats): void;
}
export function GameCanvas({
  createEngine,
  title,
  onEngine,
  onStats,
  onGameOver,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Effect Events: el motor siempre llama a los callbacks más recientes sin recrearse.
  const emitEngine = useEffectEvent(onEngine);
  const emitStats = useEffectEvent(onStats);
  const emitGameOver = useEffectEvent(onGameOver);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Buffer a la densidad de la pantalla para que el escalado por CSS no se vea borroso.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(LOGICAL_W * dpr);
    canvas.height = Math.round(LOGICAL_H * dpr);
    const engine = createEngine(canvas, {
      onStats: (stats) => emitStats(stats),
      onGameOver: (stats) => emitGameOver(stats),
    });
    emitEngine(engine);
    // Strict Mode monta dos veces: cada montaje crea su motor y la limpieza lo libera.
    return () => {
      engine.destroy();
      emitEngine(null);
    };
  }, [createEngine]);
  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      width={LOGICAL_W}
      height={LOGICAL_H}
      role="img"
      aria-label={`${title}: juego en curso`}
    />
  );
}
