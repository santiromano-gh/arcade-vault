'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { usePlayerName } from '@/lib/hooks/usePlayerName';
import { saveScore } from '@/lib/scores';
import { useUser } from '@/app/context/UserContext';
import MobileGamepad from '@/components/MobileGamepad';

const FroggerGame = dynamic(() => import('@/components/games/FroggerGame'), {
  ssr: false,
});

const SKIN_OPTIONS = [
  { key: 'classic', label: 'Classic' },
  { key: 'retro', label: 'Retro' },
  { key: 'neon', label: 'Neon' },
];

// Module-level so MobileGamepad receives a stable reference across renders.
const GAMEPAD_KEY_MAP = { up: 'w', down: 's', left: 'a', right: 'd' };

export default function FroggerPlay() {
  const { user, username } = useUser();
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef(1);
  const scoreEl = useRef<HTMLSpanElement>(null);
  const livesEl = useRef<HTMLSpanElement>(null);
  const levelEl = useRef<HTMLSpanElement>(null);
  const [paused, setPaused] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [skinKey, changeSkin] = useLocalStorage('frogger-skin', 'classic');
  const { playerName, changePlayerName, rememberPlayerName, resetPlayerName } =
    usePlayerName(username);

  const handleScoreChange = useCallback((s: number) => {
    scoreRef.current = s;
    if (scoreEl.current)
      scoreEl.current.textContent = s.toLocaleString('es-ES');
  }, []);
  const handleLevelChange = useCallback((l: number) => {
    levelRef.current = l;
    if (levelEl.current)
      levelEl.current.textContent = String(l).padStart(2, '0');
  }, []);
  const handleLivesChange = useCallback((l: number) => {
    livesRef.current = l;
    if (livesEl.current) {
      livesEl.current.innerHTML = Array.from({ length: 3 })
        .map(
          (_, i) =>
            `<span style="color:${i < l ? 'var(--green)' : 'var(--ink-dim)'}">♥</span>`,
        )
        .join('');
    }
  }, []);
  const handleGameOver = useCallback((score: number) => {
    scoreRef.current = score;
    if (scoreEl.current)
      scoreEl.current.textContent = score.toLocaleString('es-ES');
    setFinalScore(score);
  }, []);

  function restart() {
    scoreRef.current = 0;
    livesRef.current = 3;
    levelRef.current = 1;
    if (scoreEl.current) scoreEl.current.textContent = '0';
    if (livesEl.current)
      livesEl.current.innerHTML = Array.from({ length: 3 })
        .map(() => `<span style="color:var(--green)">♥</span>`)
        .join('');
    if (levelEl.current) levelEl.current.textContent = '01';
    setPaused(false);
    setFinalScore(null);
    setSaved(false);
    resetPlayerName();
    setGameKey((k) => k + 1);
  }

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  function endGame() {
    setFinalScore(scoreRef.current);
  }


  return (
    <div className="av-player fade-in">
      <div className="hidden md:block">
        <div className="player-hud">
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div className="hud-stat">
              <div className="l">Jugador</div>
              <div className="v" style={{ color: 'var(--ink)' }}>
                {playerName}
              </div>
            </div>
            <div className="hud-stat">
              <div className="l">Puntuación</div>
              <div className="v">
                <span ref={scoreEl}>0</span>
              </div>
            </div>
            <div className="hud-stat lives">
              <div className="l">Vidas</div>
              <div className="v">
                <span
                  ref={livesEl}
                  dangerouslySetInnerHTML={{
                    __html:
                      '<span style="color:var(--green)">♥</span>' +
                      '<span style="color:var(--green)">♥</span>' +
                      '<span style="color:var(--green)">♥</span>',
                  }}
                />
              </div>
            </div>
            <div className="hud-stat level">
              <div className="l">Nivel</div>
              <div className="v">
                <span ref={levelEl}>01</span>
              </div>
            </div>
            <div className="hud-stat">
              <div className="l">Skin</div>
              <div className="v">
                <select
                  value={skinKey}
                  onChange={(e) => changeSkin(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--ink-dim)',
                    color: 'var(--ink)',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    cursor: 'pointer',
                    padding: '2px 4px',
                  }}
                >
                  {SKIN_OPTIONS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="hud-actions">
            <button className="btn yellow" onClick={togglePause}>
              {paused ? 'REANUDAR' : 'PAUSA'}
            </button>
            <button className="btn magenta" onClick={endGame}>
              FIN
            </button>
            <Link href="/games/frogger" className="btn ghost">
              SALIR
            </Link>
          </div>
        </div>
      </div>

      <div className="crt w-full max-w-[800px] mx-auto">
        <div
          className="crt-screen crt-screen--scale-canvas"
          style={{ aspectRatio: '8 / 7' }}
        >
          <FroggerGame
            key={gameKey}
            paused={paused}
            skinKey={skinKey}
            onScoreChange={handleScoreChange}
            onLevelChange={handleLevelChange}
            onLivesChange={handleLivesChange}
            onGameOver={handleGameOver}
          />
          {paused && (
            <div
              className="crt-content"
              style={{ background: 'rgba(0,0,0,0.6)', zIndex: 5 }}
            >
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-dim)',
                    marginTop: 10,
                    letterSpacing: '0.16em',
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
          <span>FROGGER · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      <MobileGamepad
        keyMap={GAMEPAD_KEY_MAP}
        paused={paused}
        onPauseToggle={togglePause}
        skin={skinKey}
        onSkinChange={changeSkin}
        backHref="/games/frogger"
      />

      {finalScore !== null && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{finalScore.toLocaleString('es-ES')}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={playerName}
                  onChange={(e) => changePlayerName(e.target.value)}
                  placeholder="TUS INICIALES"
                />
                <button
                  className="btn yellow"
                  onClick={async () => {
                    setSaved(true);
                    rememberPlayerName();
                    await saveScore({
                      gameId: 'frogger',
                      playerName,
                      score: finalScore,
                      userId: user?.id ?? null,
                    });
                  }}
                >
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/games/frogger#leaderboard" className="btn cyan">
                VER LEADERBOARD
              </Link>
              <Link href="/games" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
