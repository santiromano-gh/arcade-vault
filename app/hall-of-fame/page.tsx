import { getGames, getTopScores } from '@/lib/data/games';
import HallOfFameClient, { HALL_OF_FAME_LIMIT } from './HallOfFameClient';

export default async function HallOfFame() {
  const games = await getGames();
  const firstGameId = games[0]?.id ?? '';
  const initialScores = firstGameId
    ? await getTopScores(firstGameId, HALL_OF_FAME_LIMIT)
    : [];

  return (
    <HallOfFameClient
      games={games}
      initialScores={initialScores}
      initialTab={firstGameId}
    />
  );
}
