// Cliente de Supabase de solo lectura pública, sin cookies ni sesión.
// No depende de la petición, así que se puede usar dentro de "use cache".
// Las escrituras van por el cliente de servidor (lib/supabase/server.ts).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";
// Sin estado por petición, se puede reutilizar: una sola instancia por proceso evita
// reconstruir el cliente (y sus sub-clientes de auth, storage, realtime…) en cada lectura.
let client: SupabaseClient<Database> | undefined;
export function createPublicClient(): SupabaseClient<Database> {
  if (!client) {
    const { url, publishableKey } = getSupabaseEnv();
    client = createClient<Database>(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}
