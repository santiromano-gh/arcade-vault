"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GameCanvas } from "@/components/game-canvas";
import { ENGINES } from "@/lib/engines";
import type { GameEngine, GameStats } from "@/lib/engines/types";
import type { Game } from "@/lib/games";
import { normalizeName, saveScore, useSession } from "@/lib/session";
interface Run {
  score: number;
  level: number;
}
const NEW_RUN: Run = { score: 0, level: 1 };
// Suma puntos y sube de nivel cada vez que la puntuación cruza un múltiplo de 2500,
// con la misma regla que la plantilla.
function advance(run: Run, points: number): Run {
  const score = run.score + points;
  return { score, level: score % 2500 < 100 ? run.level + 1 : run.level };
}
export function GamePlayer({ game }: { game: Game }) {
  const user = useSession();
  // Motor real del juego, si existe; sin motor se mantiene la arena con puntaje simulado.
  const createEngine = ENGINES[game.id];
  const engineRef = useRef<GameEngine | null>(null);
  const [run, setRun] = useState<Run>(NEW_RUN);
  const [lives, setLives] = useState(3);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [saved, setSaved] = useState(false);
  // null mientras el jugador no escriba su nombre: se muestra el de la sesión o INVITADO.
  const [typedName, setTypedName] = useState<string | null>(null);
  const name = typedName ?? user?.name ?? "INVITADO";
  // Puntaje simulado: Math.random solo se usa dentro del efecto, nunca en el render.
  useEffect(() => {
    if (createEngine || over || paused) return;
    const t = setInterval(() => {
      const points = Math.floor(10 + Math.random() * 90);
      setRun((r) => advance(r, points));
    }, 220);
    return () => clearInterval(t);
  }, [createEngine, over, paused]);
  // Sincroniza el motor con el estado de React: el bucle se congela en pausa y el teclado
  // del canvas se bloquea mientras el modal está abierto.
  useEffect(() => {
    if (paused) engineRef.current?.pause();
    else engineRef.current?.resume();
  }, [paused]);
  useEffect(() => {
    engineRef.current?.setInputEnabled(!over);
  }, [over]);
  // Tecla P y pausa automática al ocultar la pestaña, solo para juegos con motor.
  useEffect(() => {
    if (!createEngine) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyP" || e.repeat || over) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      setPaused((p) => !p);
    };
    const onVisibility = () => {
      if (document.hidden) setPaused(true);
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [createEngine, over]);
  const onEngine = (engine: GameEngine | null) => {
    engineRef.current = engine;
    // Un motor recién creado arranca con el estado actual de React.
    if (engine && paused) engine.pause();
    if (engine && over) engine.setInputEnabled(false);
  };
  const syncStats = (stats: GameStats) => {
    setRun({ score: stats.score, level: stats.level });
    setLives(stats.lives);
  };
  const onGameOver = (stats: GameStats) => {
    syncStats(stats);
    setOver(true);
  };
  const restart = () => {
    setRun(NEW_RUN);
    setLives(3);
    setPaused(false);
    setOver(false);
    setSaved(false);
    engineRef.current?.setInputEnabled(true);
    engineRef.current?.restart();
  };
  const end = () => {
    // Con motor, end() dispara onGameOver con la puntuación real y abre el modal.
    if (engineRef.current) engineRef.current.end();
    else setOver(true);
  };
  const onSave = () => {
    saveScore({ game: game.id, score: run.score, name });
    setSaved(true);
  };
  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{run.score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{"♥ ".repeat(lives).trim() || "—"}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(run.level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button type="button" className="btn yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button type="button" className="btn magenta" onClick={end}>
            FIN
          </button>
          <Link href={`/juegos/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>
      {createEngine && (
        <p className="keyboard-notice" role="note">
          <span className="keyboard-notice-tag">REQUIERE TECLADO</span>
          <span>Conecta uno para jugar: flechas para rotar y propulsar, Espacio para disparar.</span>
        </p>
      )}
      <div className="crt">
        <div className="crt-screen">
          {createEngine ? (
            <GameCanvas
              createEngine={createEngine}
              title={game.title}
              onEngine={onEngine}
              onStats={syncStats}
              onGameOver={onGameOver}
            />
          ) : (
            // Arena decorativa para los juegos que todavía no tienen motor.
            <div className="game-arena">
              <div className="grid-floor" />
              <div className="enemy e1" />
              <div className="enemy e2" />
              <div className="enemy e3" />
              <div className="player-ship" />
            </div>
          )}
          {paused && (
            <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>
      {over && (
        <div className="modal-bd">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
            <h2 id="game-over-title">FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{run.score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) => setTypedName(normalizeName(e.target.value))}
                  placeholder="TUS INICIALES"
                  aria-label="Tus iniciales"
                />
                <button type="button" className="btn yellow" onClick={onSave}>
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button type="button" className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/biblioteca" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
