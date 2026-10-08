import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Leaderboard } from "@/components/leaderboard";
import { GAMES, getGame, seededScores } from "@/lib/games";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

// Los ids de GAMES se prerenderizan completos. Para un id desconocido, el id se resuelve
// en tiempo de petición: el Suspense deja que nav y footer salgan del servidor y que
// notFound() muestre la 404 en su lugar en vez de un documento de error vacío.
export default function GameDetailPage({ params }: PageProps<"/juegos/[id]">) {
  return (
    <Suspense>
      <GameDetail params={params} />
    </Suspense>
  );
}

async function GameDetail({ params }: Pick<PageProps<"/juegos/[id]">, "params">) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  // Misma semilla que la plantilla: el leaderboard es idéntico en cada carga.
  const scores = seededScores(id.length * 17 + 3, 10);

  return (
    <div className="av-detail fade-in">
      <div>
        <div className="detail-cover">
          <div className={"cover-bg " + game.cover} />
        </div>
        <div style={{ marginTop: 20 }} className="detail-info">
          <div className="detail-tags">
            <span>{game.cat}</span>
            <span>1 JUGADOR</span>
            <span>TECLADO / TÁCTIL</span>
            <span>RETRO 1985</span>
          </div>
          <h2 className="neon-cyan">{game.title}</h2>
          <p>{game.long}</p>
          <div className="stat-strip">
            <div>
              <div className="l">Partidas</div>
              <div className="v">{game.plays}</div>
            </div>
            <div>
              <div className="l">Mejor global</div>
              <div className="v" style={{ color: "var(--magenta)", textShadow: "0 0 6px rgba(255,0,110,0.5)" }}>
                {game.best.toLocaleString("es-ES")}
              </div>
            </div>
            <div>
              <div className="l">Dificultad</div>
              <div className="v" style={{ color: "var(--yellow)", textShadow: "0 0 6px rgba(245,255,0,0.5)" }}>
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>
          <div className="detail-actions">
            <Link href={`/juegos/${game.id}/jugar`} className="btn xl pulse">
              ▶  JUGAR AHORA
            </Link>
            <Link href="/" className="btn ghost lg">
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      <aside>
        <Leaderboard rows={scores} />
      </aside>
    </div>
  );
}
