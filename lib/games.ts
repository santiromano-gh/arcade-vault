// Capa de datos del catálogo y de los rankings. Supabase es la única fuente de verdad:
// tabla `games`, vista `game_stats` (best, plays) y vista `leaderboard` (mejor marca por jugador).
// Las lecturas se cachean con "use cache" y se invalidan por tag: `games` y `scores`.
import { cacheTag } from "next/cache";
import {
  toScoreRow,
  LEADERBOARD_COLUMNS,
  type Game,
  type GameStatsRow,
  type GameRow,
  type ScoreRow,
} from "@/lib/games-shared";
import { createPublicClient } from "@/lib/supabase/public";

// Los consumidores de servidor siguen importando tipos, CATS y formateadores desde aquí.
export * from "@/lib/games-shared";

const GAME_COLUMNS = "id, title, short, long, cat, cover, color";

function toGame(row: GameRow, stats: GameStatsRow | undefined): Game {
  return { ...row, best: stats?.best ?? 0, plays: stats?.plays ?? 0 };
}

// El error lleva el contexto para los logs del servidor; en producción
// el cliente solo recibe un mensaje genérico y app/error.tsx muestra la pantalla de error.
function fail(what: string, message: string): never {
  throw new Error(`No se pudo leer ${what} de Supabase: ${message}`);
}
// Todos los juegos, en el orden de `sort_order`.
export async function getGames(): Promise<Game[]> {
  "use cache";
  cacheTag("games", "scores");
  const supabase = createPublicClient();
  const [games, stats] = await Promise.all([
    supabase.from("games").select(GAME_COLUMNS).order("sort_order"),
    supabase.from("game_stats").select("game_id, best, plays"),
  ]);
  if (games.error) fail("el catálogo", games.error.message);
  if (stats.error) fail("las estadísticas", stats.error.message);
  const statsById = new Map(stats.data.map((s) => [s.game_id, s]));
  return games.data.map((g) => toGame(g, statsById.get(g.id)));
}
// Un juego por su id, o null si no existe.
export async function getGame(id: string): Promise<Game | null> {
  "use cache";
  cacheTag("games", "scores");
  const supabase = createPublicClient();
  const [game, stats] = await Promise.all([
    supabase.from("games").select(GAME_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("game_stats").select("game_id, best, plays").eq("game_id", id).maybeSingle(),
  ]);
  if (game.error) fail("el juego", game.error.message);
  if (stats.error) fail("las estadísticas", stats.error.message);
  return game.data ? toGame(game.data, stats.data ?? undefined) : null;
}
// Ranking de un juego: una fila por jugador con su mejor marca, ordenado por `rank`.
export async function getLeaderboard(gameId: string, limit: number): Promise<ScoreRow[]> {
  "use cache";
  cacheTag("scores");
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("leaderboard")
    .select(LEADERBOARD_COLUMNS)
    .eq("game_id", gameId)
    .order("rank")
    .limit(limit);
  if (error) fail("el ranking", error.message);
  return data.map(toScoreRow);
}
