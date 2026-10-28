// Cliente de Supabase para Server Components, Server Functions y Route Handlers.
// Usa cookies(), una API de petición: la ruta que lo llame se renderiza en cada petición.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";
export async function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Escribir cookies desde un Server Component falla y es esperable:
          // solo Server Functions y Route Handlers pueden hacerlo.
        }
      },
    },
  });
}
