import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GamePlayer } from "@/components/game-player";
import { GAMES, getGame } from "@/lib/games";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

// Mismo patrón que el detalle: el Suspense permite que notFound() muestre la 404
// con nav y footer renderizados en el servidor para ids desconocidos.
export default function PlayPage({ params }: PageProps<"/juegos/[id]/jugar">) {
  return (
    <Suspense>
      <Player params={params} />
    </Suspense>
  );
}

async function Player({ params }: Pick<PageProps<"/juegos/[id]/jugar">, "params">) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  // key: al pasar de un juego a otro se reinicia la partida.
  return <GamePlayer key={game.id} game={game} />;
}
