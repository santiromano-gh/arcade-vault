'use client';

import { useCallback, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

const PLAYER_NAME_STORAGE_KEY = 'av_player_name';
const GUEST_NAME = 'INVITADO';
const MAX_PLAYER_NAME_LENGTH = 10;

/**
 * Name shown in the HUD and used when saving a score.
 * Priority: name typed by the player > account username > last saved name > guest.
 */
export function usePlayerName(username: string | null | undefined) {
  const [typedName, setTypedName] = useState<string | null>(null);
  const [lastSavedName, setLastSavedName] = useLocalStorage(
    PLAYER_NAME_STORAGE_KEY,
    '',
  );

  const playerName = typedName ?? username ?? (lastSavedName || GUEST_NAME);

  const changePlayerName = useCallback((rawName: string) => {
    setTypedName(rawName.toUpperCase().slice(0, MAX_PLAYER_NAME_LENGTH));
  }, []);

  const rememberPlayerName = useCallback(() => {
    setLastSavedName(playerName);
  }, [playerName, setLastSavedName]);

  const resetPlayerName = useCallback(() => setTypedName(null), []);

  return { playerName, changePlayerName, rememberPlayerName, resetPlayerName };
}
