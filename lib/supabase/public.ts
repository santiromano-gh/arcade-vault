// Cliente de Supabase de solo lectura pública, sin cookies ni sesión.
// No depende de la petición, así que se puede usar dentro de "use cache".
// Las escrituras van por el cliente de servidor (lib/supabase/server.ts).
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";
export function createPublicClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
