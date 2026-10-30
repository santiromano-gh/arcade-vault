"use server";
// Guardado de puntuaciones. Una Server Action es un endpoint público:
// la entrada se valida aquí aunque la base de datos repita las reglas con CHECKs y RLS.
import { updateTag } from "next/cache";
import { getGame } from "@/lib/games";
import { createClient } from "@/lib/supabase/server";
export type SubmitScoreResult = { ok: true } | { ok: false; error: string };
const MAX_SCORE = 10_000_000;
const MAX_NAME_LENGTH = 10;
const GENERIC_ERROR = "No se pudo guardar la puntuación.";
export async function submitScore(input: {
  gameId: string;
  name: string;
  score: number;
}): Promise<SubmitScoreResult> {
  const { gameId, name, score } = input ?? {};
  if (typeof gameId !== "string" || typeof name !== "string") {
    return { ok: false, error: GENERIC_ERROR };
  }
  // Misma normalización que la sesión mock: el nombre se guarda en mayúsculas.
  const playerName = name.trim().toUpperCase();
  const validScore = Number.isInteger(score) && score >= 0 && score <= MAX_SCORE;
  const validName = playerName.length >= 1 && playerName.length <= MAX_NAME_LENGTH;
  if (!validScore || !validName) return { ok: false, error: GENERIC_ERROR };
  try {
    if (!(await getGame(gameId))) return { ok: false, error: GENERIC_ERROR };
    const supabase = await createClient();
    const { error } = await supabase
      .from("scores")
      .insert({ game_id: gameId, player_name: playerName, score });
    if (error) {
      console.error("submitScore: Supabase rechazó la puntuación:", error.message);
      return { ok: false, error: GENERIC_ERROR };
    }
  } catch (error) {
    console.error("submitScore: no se pudo contactar con Supabase:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
  // Rankings, `best` y `plays` dependen de `scores`: la siguiente visita los lee frescos.
  updateTag("scores");
  return { ok: true };
}
