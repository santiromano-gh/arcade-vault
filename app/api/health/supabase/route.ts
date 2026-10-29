import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
type SaludRespuesta = { ok: true } | { ok: false; error: string };
const ERROR_CONEXION = "No se pudo conectar con Supabase.";
function responder(cuerpo: SaludRespuesta, status: number) {
  return Response.json(cuerpo, { status });
}
export async function GET() {
  // Construir el cliente de servidor valida las variables y lee las cookies,
  // así la ruta se resuelve en cada petición y nunca se prerenderiza.
  // Va fuera del try: el prerender interrumpe cookies() y Next debe ver ese rechazo,
  // y una variable ausente es un error de configuración que debe nombrarse en el log.
  await createClient();
  const { url, publishableKey } = getSupabaseEnv();
  try {
    const respuesta = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: publishableKey },
      cache: "no-store",
    });
    if (!respuesta.ok) {
      console.error(`[health/supabase] Supabase respondió ${respuesta.status}.`);
      return responder({ ok: false, error: ERROR_CONEXION }, 503);
    }
    return responder({ ok: true }, 200);
  } catch (error) {
    console.error("[health/supabase]", error);
    return responder({ ok: false, error: ERROR_CONEXION }, 503);
  }
}
