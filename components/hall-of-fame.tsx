"use client";

import { useState } from "react";
import { GAMES, scoreSeed, seededScores, type ScoreRow } from "@/lib/games";
import { useSession } from "@/lib/session";

const TOP_CLASS = [" top1", " top2", " top3"];

function PodiumSlot({ row, place }: { row: ScoreRow; place: "silver" | "bronze" }) {
  return (
    <div className={"podium-slot " + place}>
      <div className="rank-num">{String(row.rank).padStart(2, "0")}</div>
      <div className="name">{row.name}</div>
      <div className="score">{row.score.toLocaleString("es-ES")}</div>
      <div className="date">{row.date}</div>
    </div>
  );
}

export function HallOfFame() {
  const user = useSession();
  const [tab, setTab] = useState(GAMES[0].id);
  const game = GAMES.find((g) => g.id === tab) ?? GAMES[0];

  // Semilla derivada del id: cada pestaña tiene datos propios y siempre los mismos.
  const rows = seededScores(scoreSeed(tab, "salon"), 12);
  const [first, second, third] = rows;

  // Marca personal simulada, igual que en la plantilla (no lee av_scores).
  const youRank = Math.floor(8 + (tab.length % 4));
  const youScore = rows[5] ? rows[5].score - 2400 : 9999;

  return (
    <>
      <div className="hall-tabs">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            className={"chip" + (tab === g.id ? " active" : "")}
            aria-pressed={tab === g.id}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      <div className="podium">
        <PodiumSlot row={second} place="silver" />
        <div className="podium-slot gold">
          <div className="pixel" style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.18em" }}>
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

      <div className="hall-table">
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.name + i}
            className={"tr" + (TOP_CLASS[i] ?? "")}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
            <div className="pl">{r.name}</div>
            <div className="sc">{r.score.toLocaleString("es-ES")}</div>
            <div className="dt">{r.date}</div>
          </div>
        ))}
        {user && (
          <>
            <div className="tr you-label">▸ TU MEJOR MARCA EN {game.title}</div>
            <div className="tr you" style={{ animationDelay: `${rows.length * 50 + 50}ms` }}>
              <div className="rk" style={{ color: "var(--yellow)" }}>
                #{String(youRank).padStart(2, "0")}
              </div>
              <div className="pl" style={{ color: "var(--yellow)" }}>
                {user.name}
              </div>
              <div className="sc" style={{ color: "var(--yellow)", textShadow: "0 0 6px rgba(245,255,0,0.5)" }}>
                {(youScore || 9999).toLocaleString("es-ES")}
              </div>
              <div className="dt">11/05/2026</div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
