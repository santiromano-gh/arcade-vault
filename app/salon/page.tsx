import Link from "next/link";
import { HallOfFame } from "@/components/hall-of-fame";
import { getGames, getLeaderboard, type ScoreRow } from "@/lib/games";
const HALL_SIZE = 12;
export default async function SalonPage() {
  const games = await getGames();
  const boards = await Promise.all(games.map((g) => getLeaderboard(g.id, HALL_SIZE)));
  const rankings: Record<string, ScoreRow[]> = Object.fromEntries(
    games.map((g, i) => [g.id, boards[i]]),
  );
  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>
      <HallOfFame games={games} rankings={rankings} />
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/biblioteca" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
