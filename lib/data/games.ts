import { unstable_cache } from 'next/cache';
import { connection } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import type {
  GameRow,
  GameSummary,
  LeaderboardEntry,
} from '@/lib/supabase/types';

/** The catalog changes only on deploys/migrations; scores are always live. */
const CATALOG_REVALIDATE_SECONDS = 3600;
export const GAMES_CACHE_TAG = 'games';

const GAME_SUMMARY_COLUMNS = 'id, title, short, cat, cover, color';
const LEADERBOARD_COLUMNS = 'id, player_name, score, created_at';

export const getGames = unstable_cache(
  async (): Promise<GameSummary[]> => {
    const { data, error } = await createPublicClient()
      .from('games')
      .select(GAME_SUMMARY_COLUMNS)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },
  ['games:list'],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [GAMES_CACHE_TAG] },
);

export const getGame = unstable_cache(
  async (id: string): Promise<GameRow | null> => {
    const { data, error } = await createPublicClient()
      .from('games')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  ['games:detail'],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [GAMES_CACHE_TAG] },
);

/** Always read at request time so a freshly saved score shows up immediately. */
export async function getTopScores(
  gameId: string,
  limit: number,
): Promise<LeaderboardEntry[]> {
  await connection();
  const { data } = await createPublicClient()
    .from('scores')
    .select(LEADERBOARD_COLUMNS)
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .limit(limit);
  return data ?? [];
}
