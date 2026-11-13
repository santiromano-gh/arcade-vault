export interface GameRow {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: 'ARCADE' | 'PUZZLE' | 'SHOOTER';
  cover: string;
  color: 'cyan' | 'magenta' | 'yellow' | 'green' | 'lime';
  sort_order: number;
  created_at: string;
}

/** Columns needed to render a game card or tab — omits the long description. */
export type GameSummary = Pick<
  GameRow,
  'id' | 'title' | 'short' | 'cat' | 'cover' | 'color'
>;

export interface ScoreRow {
  id: string;
  game_id: string;
  player_name: string;
  score: number;
  user_id: string | null;
  created_at: string;
}

/** Columns needed to render a leaderboard row. */
export type LeaderboardEntry = Pick<
  ScoreRow,
  'id' | 'player_name' | 'score' | 'created_at'
>;
