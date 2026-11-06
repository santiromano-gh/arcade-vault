// Skins de los motores: identificadores comunes a todos los juegos. Cada motor define sus
// paletas en lib/engines/<id>/skins.ts con un Record<SkinId, Paleta>. Sin acceso a window:
// este módulo se evalúa también en el servidor.
export type SkinId = "clasico" | "neon" | "retro";
export const SKIN_IDS: readonly SkinId[] = ["clasico", "neon", "retro"];
// CLÁSICO es siempre el aspecto original del juego.
export const DEFAULT_SKIN: SkinId = "clasico";
export const SKIN_LABELS: Record<SkinId, string> = {
  clasico: "CLÁSICO",
  neon: "NEÓN",
  retro: "RETRO",
};
export function isSkinId(value: unknown): value is SkinId {
  return typeof value === "string" && (SKIN_IDS as readonly string[]).includes(value);
}
