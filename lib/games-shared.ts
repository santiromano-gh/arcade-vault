// Tipos, constantes y formateadores del catálogo que se pueden usar también en Client Components.
// La lectura de datos vive en lib/games.ts, que depende de APIs solo de servidor ("use cache", cacheTag).
import type { Database } from "@/lib/supabase/database.types";
export type GameCategory = Database["public"]["Enums"]["game_category"];
export type GameColor = Database["public"]["Enums"]["game_color"];
export interface Game {
  id: string; // slug usado en la URL: "bloque-buster", "caida", …
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string; // clase CSS de portada: "cover-bricks", …
  color: GameColor;
  best: number; // game_stats.best
  plays: number; // game_stats.plays; se formatea con formatPlays al mostrarlo
}
export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // "DD/MM/AAAA", desde created_at
}
export const CATS = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"] as const satisfies readonly [
  "TODOS",
  ...GameCategory[],
];
export type CategoryFilter = (typeof CATS)[number];
export type GameRow = Pick<
  Database["public"]["Tables"]["games"]["Row"],
  "id" | "title" | "short" | "long" | "cat" | "cover" | "color"
>;
export type GameStatsRow = Database["public"]["Views"]["game_stats"]["Row"];
export type LeaderboardRow = Pick<
  Database["public"]["Views"]["leaderboard"]["Row"],
  "rank" | "player_name" | "score" | "created_at"
>;
// Columnas de la vista `leaderboard` que se convierten en ScoreRow (servidor y navegador).
export const LEADERBOARD_COLUMNS = "rank, player_name, score, created_at";
// Las columnas de una vista llegan como nullables en los tipos generados,
// aunque la definición de `leaderboard` nunca las deje vacías.
export function toScoreRow(row: LeaderboardRow): ScoreRow {
  return {
    rank: row.rank ?? 0,
    name: row.player_name ?? "",
    score: row.score ?? 0,
    date: formatDate(row.created_at ?? ""),
  };
}
// "2026-10-02T22:05:00+00:00" → "02/10/2026". Se usa la fecha UTC tal como la devuelve
// Postgres, para que servidor y navegador muestren lo mismo.
export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-");
  return day && month && year ? `${day}/${month}/${year}` : "";
}
// 950 → "950", 12400 → "12.4K", 2_300_000 → "2.3M".
export function formatPlays(plays: number): string {
  if (plays >= 1_000_000) return `${(plays / 1_000_000).toFixed(1)}M`;
  if (plays >= 1_000) return `${(plays / 1_000).toFixed(1)}K`;
  return String(plays);
}
