"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { submitScore } from "@/app/juegos/[id]/jugar/actions";
import { GameCanvas } from "@/components/game-canvas";
import { ENGINES } from "@/lib/engines";
import type { GameEngine, GameStats } from "@/lib/engines/types";
import type { Game } from "@/lib/games";
import { normalizeName, useSession } from "@/lib/session";
interface Run {
  score: number;
  level: number;
}
const NEW_RUN: Run = { score: 0, level: 1 };
type SaveState = "idle" | "saving" | "saved" | "error";
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
  const [saveState, setSaveState] = useState<SaveState>("idle");
  // Bloqueo síncrono: dos clics seguidos llegan antes de que React pinte el botón deshabilitado.
  const savingRef = useRef(false);
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
    // El teclado se bloquea aquí, en el mismo frame del fin de partida, y no en el efecto de
    // `over`: ese efecto llega frames después y, mientras tanto, un Espacio (disparar) reiniciaba
    // la partida en el motor y la puntuación final pasaba a 0 con el modal ya abierto.
    engineRef.current?.setInputEnabled(false);
    syncStats(stats);
    setOver(true);
  };
  const restart = () => {
    setRun(NEW_RUN);
    setLives(3);
    setPaused(false);
    setOver(false);
    setSaveState("idle");
    engineRef.current?.setInputEnabled(true);
    engineRef.current?.restart();
  };
  const end = () => {
    // Con motor, end() dispara onGameOver con la puntuación real y abre el modal.
    if (engineRef.current) engineRef.current.end();
    else setOver(true);
  };
  const onSave = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaveState("saving");
    try {
      const result = await submitScore({ gameId: game.id, name, score: run.score });
      setSaveState(result.ok ? "saved" : "error");
    } catch {
      // Sin red la acción rechaza la promesa en lugar de devolver { ok: false }.
      setSaveState("error");
    } finally {
      savingRef.current = false;
    }
  };
  const saving = saveState === "saving";
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
          <span>
            Conecta uno para jugar: flechas para rotar y propulsar, Espacio para disparar.
          </span>
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
            {saveState !== "saved" ? (
              <>
                <div className="input-row">
                  <input
                    value={name}
                    onChange={(e) => setTypedName(normalizeName(e.target.value))}
                    placeholder="TUS INICIALES"
                    aria-label="Tus iniciales"
                    disabled={saving}
                  />
                  <button
                    type="button"
                    className="btn yellow"
                    onClick={onSave}
                    disabled={saving || name.trim() === ""}
                    aria-busy={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner save-spinner" aria-hidden="true" />
                        GUARDANDO…
                      </>
                    ) : saveState === "error" ? (
                      "REINTENTAR"
                    ) : (
                      "GUARDAR PUNTUACIÓN"
                    )}
                  </button>
                </div>
                {saveState === "error" && (
                  <p className="save-error" role="alert">
                    ▸ NO SE PUDO GUARDAR. Comprueba tu conexión y vuelve a intentarlo.
                  </p>
                )}
              </>
            ) : (
              <div className="toast-saved" role="status">
                ▸ PUNTUACIÓN GUARDADA_
              </div>
            )}
            <div className="actions">
              {/* Reiniciar con un guardado en curso mezclaría su resultado con la partida nueva. */}
              <button type="button" className="btn" onClick={restart} disabled={saving}>
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
