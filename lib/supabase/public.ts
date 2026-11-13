import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side client for public, RLS-readable data (catalog, leaderboards).
 * It never reads cookies, so it can run inside cache scopes and keeps the
 * routes that use it statically renderable.
 */
export const createPublicClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
