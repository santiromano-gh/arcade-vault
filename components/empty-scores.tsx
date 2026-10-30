import Link from "next/link";
// Ranking sin partidas: una tabla "de fábrica" con huecos vacíos y el #01 esperando nombre.
// playHref es opcional: el detalle ya tiene su propio botón de jugar al lado.
export function EmptyScores({ playHref }: { playHref?: string }) {
  return (
    <div className="empty-scores">
      <div className="es-slots" aria-hidden="true">
        {["01", "02", "03"].map((rank) => (
          <div key={rank} className="es-slot">
            <span className="es-rk">#{rank}</span>
            <span className="es-pl">----------</span>
            <span className="es-sc">0</span>
          </div>
        ))}
      </div>
      <div className="es-msg">
        <div className="es-title pixel">SIN PUNTUACIONES TODAVÍA</div>
        <p>Nadie ha firmado esta máquina. Juega una partida y el #01 es tuyo.</p>
        {playHref && (
          <Link href={playHref} className="btn yellow">
            ▶ JUGAR AHORA
          </Link>
        )}
      </div>
    </div>
  );
}
