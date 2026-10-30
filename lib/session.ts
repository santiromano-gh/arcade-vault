"use client";
// Sesión mock en localStorage. Solo cliente; las puntuaciones se guardan en Supabase.
// Todo acceso a localStorage va en try/catch: si falla, la app se comporta como sin sesión.
import { useSyncExternalStore } from "react";
export interface SessionUser {
  name: string; // mayúsculas, máx. 10 caracteres
}
const USER_KEY = "av_user";
const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}
// useSyncExternalStore exige que el snapshot sea estable entre llamadas:
// se cachea el objeto parseado mientras el string guardado no cambie.
let cachedRaw: string | null = null;
let cachedUser: SessionUser | null = null;
function readUser(): SessionUser | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
  if (raw === cachedRaw) return cachedUser;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    cachedUser =
      parsed && typeof parsed === "object" && typeof (parsed as SessionUser).name === "string"
        ? { name: (parsed as SessionUser).name }
        : null;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  // Sincroniza también los cambios hechos desde otras pestañas.
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === USER_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
export function normalizeName(name: string): string {
  return name.toUpperCase().slice(0, 10);
}
export function signIn(name: string): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify({ name: normalizeName(name) }));
  } catch {}
  emit();
}
export function signOut(): void {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {}
  emit();
}
// En el servidor y durante la hidratación devuelve null; el estado con sesión
// aparece tras hidratar, evitando errores de hidratación.
export function useSession(): SessionUser | null {
  return useSyncExternalStore(subscribe, readUser, () => null);
}
