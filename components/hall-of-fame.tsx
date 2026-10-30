"use client";
import { useEffect, useState } from "react";
import { EmptyScores } from "@/components/empty-scores";
import { LEADERBOARD_COLUMNS, toScoreRow, type Game, type ScoreRow } from "@/lib/games-shared";
import { useSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
const TOP_CLASS = [" top1", " top2", " top3"];
const YOU_COLOR = { color: "var(--yellow)" };
function PodiumSlot({ row, place }: { row: ScoreRow | undefined; place: "silver" | "bronze" }) {
  return (
    <div className={"podium-slot " + place}>
      <div className="rank-num">{place === "silver" ? "02" : "03"}</div>
      <div className="name">{row?.name ?? "---"}</div>
      <div className="score">{row ? row.score.toLocaleString("es-ES") : "0"}</div>
      <div className="date">{row?.date ?? "--/--/----"}</div>
    </div>
  );
}
interface Lookup {
  key: string; // juego y jugador consultados
  row: ScoreRow | null;
  failed: boolean;
}
// Mejor marca del jugador de la sesión mock, consultada en el navegador sobre la vista
// `leaderboard`: el rango es el mismo que ve el resto de jugadores.
function PersonalBest({ game, name, delay }: { game: Game; name: string; delay: number }) {
  const key = `${game.id}|${name}`;
  const [lookup, setLookup] = useState<Lookup | null>(null);
  useEffect(() => {
    let cancelled = false;
    createClient()
      .from("leaderboard")
      .select(LEADERBOARD_COLUMNS)
      .eq("game_id", game.id)
      .eq("player_name", name)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setLookup({ key, row: data ? toScoreRow(data) : null, failed: Boolean(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [key, game.id, name]);
  // Mientras llega la respuesta del juego o jugador actual no se muestra el dato anterior.
  const current = lookup?.key === key ? lookup : null;
  const row = current?.row;
  let status = "";
  if (!current) status = "BUSCANDO…";
  else if (current.failed) status = "MARCA NO DISPONIBLE";
  else if (!row) status = "SIN MARCA TODAVÍA";
  return (
    <>
      <div className="tr you-label">▸ TU MEJOR MARCA EN {game.title}</div>
      <div className="tr you" style={{ animationDelay: `${delay}ms` }} aria-live="polite">
        <div className="rk" style={YOU_COLOR}>
          #{row ? String(row.rank).padStart(2, "0") : "--"}
        </div>
        <div className="pl" style={YOU_COLOR}>
          {name}
        </div>
        {row ? (
          <div className="sc" style={{ ...YOU_COLOR, textShadow: "0 0 6px rgba(245,255,0,0.5)" }}>
            {row.score.toLocaleString("es-ES")}
          </div>
        ) : (
          <div className="sc you-status">{status}</div>
        )}
        <div className="dt">{row?.date ?? "—"}</div>
      </div>
    </>
  );
}
export function HallOfFame({
  games,
  rankings,
}: {
  games: Game[];
  rankings: Record<string, ScoreRow[]>;
}) {
  const user = useSession();
  const [tab, setTab] = useState(games[0]?.id);
  const game = games.find((g) => g.id === tab) ?? games[0];
  if (!game) return null;
  const rows = rankings[game.id] ?? [];
  const [first, second, third] = rows;
  return (
    <>
      <div className="hall-tabs">
        {games.map((g) => (
          <button
            key={g.id}
            type="button"
            className={"chip" + (game.id === g.id ? " active" : "")}
            aria-pressed={game.id === g.id}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>
      {first && (
        <div className="podium">
          <PodiumSlot row={second} place="silver" />
          <div className="podium-slot gold">
            <div
              className="pixel"
              style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.18em" }}
            >
              CAMPEÓN
            </div>
            <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>
              01
            </div>
            <div className="name">{first.name}</div>
            <div className="score" style={{ fontSize: 20 }}>
              {first.score.toLocaleString("es-ES")}
            </div>
            <div className="date">{first.date}</div>
          </div>
          <PodiumSlot row={third} place="bronze" />
        </div>
      )}
      <div className="hall-table">
        {rows.length > 0 ? (
          <div className="th">
            <div>RANGO</div>
            <div>JUGADOR</div>
            <div>PUNTUACIÓN</div>
            <div>FECHA</div>
          </div>
        ) : (
          <EmptyScores playHref={`/juegos/${game.id}/jugar`} />
        )}
        {rows.map((r, i) => (
          <div
            key={r.name}
            className={"tr" + (TOP_CLASS[i] ?? "")}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
            <div className="pl">{r.name}</div>
            <div className="sc">{r.score.toLocaleString("es-ES")}</div>
            <div className="dt">{r.date}</div>
          </div>
        ))}
        {user && <PersonalBest game={game} name={user.name} delay={rows.length * 50 + 50} />}
      </div>
    </>
  );
}
