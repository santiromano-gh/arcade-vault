"use client";
// Skin elegida por juego, persistida en localStorage (clave av_skin_<gameId>). Mismo patrón
// que lib/session.ts: todo acceso a localStorage va en try/catch y, si falla o el valor no es
// válido, se usa DEFAULT_SKIN.
import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_SKIN, isSkinId, type SkinId } from "@/lib/engines/skins";
const listeners = new Set<() => void>();
const skinKey = (gameId: string) => `av_skin_${gameId}`;
function emit() {
  for (const listener of listeners) listener();
}
// El snapshot es un string: estable entre llamadas sin necesidad de caché.
function readSkin(gameId: string): SkinId {
  try {
    const raw = localStorage.getItem(skinKey(gameId));
    return isSkinId(raw) ? raw : DEFAULT_SKIN;
  } catch {
    return DEFAULT_SKIN;
  }
}
function writeSkin(gameId: string, skin: SkinId): void {
  try {
    localStorage.setItem(skinKey(gameId), skin);
  } catch {}
  emit();
}
function subscribeTo(gameId: string, listener: () => void) {
  listeners.add(listener);
  // Sincroniza también los cambios hechos desde otras pestañas.
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === skinKey(gameId)) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
const serverSkin = (): SkinId => DEFAULT_SKIN;
// En el servidor y durante la hidratación devuelve DEFAULT_SKIN; la skin guardada aparece
// tras hidratar, evitando errores de hidratación.
export function useSkin(gameId: string): [SkinId, (skin: SkinId) => void] {
  const subscribe = useCallback((listener: () => void) => subscribeTo(gameId, listener), [gameId]);
  const getSnapshot = useCallback(() => readSkin(gameId), [gameId]);
  const skin = useSyncExternalStore(subscribe, getSnapshot, serverSkin);
  const setSkin = useCallback((next: SkinId) => writeSkin(gameId, next), [gameId]);
  return [skin, setSkin];
}
