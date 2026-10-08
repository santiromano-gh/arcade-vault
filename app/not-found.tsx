import Link from "next/link";

export default function NotFound() {
  return (
    <section className="av-hero fade-in">
      <h1 className="flicker">404</h1>
      <div className="sub">
        ESTE CARTUCHO NO ESTÁ EN EL VAULT <span className="blink">_</span>
      </div>
      <p style={{ color: "var(--ink-dim)", margin: "24px auto 32px", maxWidth: 480 }}>
        El juego que buscas no existe o cambió de dirección. Vuelve a la biblioteca y elige otro.
      </p>
      <Link href="/" className="btn lg">
        VOLVER AL VAULT
      </Link>
    </section>
  );
}
