'use client';

import { useCallback, useSyncExternalStore } from 'react';

const sameTabListeners = new Set<() => void>();

// The native `storage` event only fires in other tabs, so writes made from
// this tab notify subscribers through `sameTabListeners`.
function subscribe(onStoreChange: () => void) {
  sameTabListeners.add(onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    sameTabListeners.delete(onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

function notifySameTabListeners() {
  sameTabListeners.forEach((notify) => notify());
}

/**
 * Reads and writes a string value in `localStorage` without hydration
 * mismatches: the server render (and the first client render) uses
 * `fallback`, then the stored value takes over.
 */
export function useLocalStorage(key: string, fallback: string) {
  const value = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key) ?? fallback,
    () => fallback,
  );

  const setValue = useCallback(
    (nextValue: string) => {
      localStorage.setItem(key, nextValue);
      notifySameTabListeners();
    },
    [key],
  );

  return [value, setValue] as const;
}
