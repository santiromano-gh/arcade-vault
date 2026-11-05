import Link from "next/link";
import { HallOfFame } from "@/components/hall-of-fame";
import { getGames, getLeaderboards } from "@/lib/games";
const HALL_SIZE = 12;
export default async function SalonPage() {
  const games = await getGames();
  const rankings = await getLeaderboards(
    games.map((g) => g.id),
    HALL_SIZE,
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
