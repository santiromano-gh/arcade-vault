'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

interface UserContextValue {
  user: User | null;
  session: Session | null;
  username: string | null;
  avatarUrl: string | null;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  session: null,
  username: null,
  avatarUrl: null,
  signOut: async () => {},
});

// supabase-js is loaded after hydration so it stays out of every page's initial bundle.
const loadSupabaseClient = () =>
  import('@/lib/supabase/client').then(({ createClient }) => createClient());

function deriveUsername(user: User | null): string | null {
  return (
    user?.user_metadata?.username ??
    user?.user_metadata?.full_name?.split(' ')[0]?.toUpperCase().slice(0, 10) ??
    user?.email?.split('@')[0]?.toUpperCase().slice(0, 10) ??
    null
  );
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    loadSupabaseClient().then((supabase) => {
      if (cancelled) return;
      // onAuthStateChange emits INITIAL_SESSION on subscribe, so no separate getSession() is needed.
      const { data } = supabase.auth.onAuthStateChange((_event, nextSession) =>
        setSession(nextSession),
      );
      unsubscribe = () => data.subscription.unsubscribe();
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = await loadSupabaseClient();
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<UserContextValue>(() => {
    const user = session?.user ?? null;
    return {
      user,
      session,
      username: deriveUsername(user),
      avatarUrl:
        user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null,
      signOut,
    };
  }, [session, signOut]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
