interface NewScore {
  gameId: string;
  playerName: string;
  score: number;
  userId: string | null;
}

/**
 * Persists a finished game's score. supabase-js is imported on demand so
 * play pages don't ship it until the player actually saves.
 */
export async function saveScore({ gameId, playerName, score, userId }: NewScore) {
  const { createClient } = await import('@/lib/supabase/client');
  return createClient().from('scores').insert({
    game_id: gameId,
    player_name: playerName,
    score,
    user_id: userId,
  });
}
