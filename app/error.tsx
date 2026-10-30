"use client"; // Los límites de error deben ser Client Components.
import { useEffect } from "react";
// Pantalla de "señal perdida" cuando el catálogo o los rankings no se pueden leer de Supabase.
// No muestra el mensaje del error: en producción es genérico y en desarrollo podría incluir detalles internos.
export default function VaultError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="av-hero vault-error fade-in">
      <div className="ve-signal pixel" aria-hidden="true">
        <span className="ve-led" />
        SIN SEÑAL
      </div>
      <h1 className="ve-title">NO SE PUDO CARGAR EL VAULT</h1>
      <div className="ve-static" aria-hidden="true" />
      <p className="ve-copy">
        No hemos podido conectar con la base de datos de juegos y puntuaciones. Comprueba tu
        conexión y vuelve a intentarlo.
      </p>
      <button type="button" className="btn lg magenta" onClick={() => retry()}>
        REINTENTAR
      </button>
    </section>
  );
}
