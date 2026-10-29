// Variables públicas de Supabase. Se leen con acceso estático a process.env
// para que Next las incruste en el bundle del navegador.
export interface SupabaseEnv {
  url: string;
  publishableKey: string;
}
function requerida(nombre: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}. Añádela a .env.local.`);
  }
  return valor;
}
export function getSupabaseEnv(): SupabaseEnv {
  return {
    url: requerida("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    publishableKey: requerida(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  };
}
