"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type MouseEvent } from "react";
import type { Game } from "@/lib/games";
const BTN_COLOR: Record<Game["color"], string> = {
  cyan: "",
  green: "",
  magenta: " magenta",
  yellow: " yellow",
};
export function GameCard({ game }: { game: Game }) {
  const router = useRouter();
  const tiltRef = useRef<HTMLDivElement>(null);
  const href = `/juegos/${game.id}`;
  // Efecto tilt: inclina la tarjeta según la posición del cursor. El rectángulo se mide al
  // entrar (no en cada mousemove, que forzaría un layout síncrono) y la escritura del estilo
  // se agrupa en un requestAnimationFrame: como mucho un cambio por frame.
  const rectRef = useRef<DOMRect | null>(null);
  const frameRef = useRef(0);
  const onEnter = () => {
    rectRef.current = tiltRef.current?.getBoundingClientRect() ?? null;
  };
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const el = tiltRef.current;
      const r = rectRef.current;
      if (!el || !r) return;
      const px = (clientX - r.left) / r.width - 0.5;
      const py = (clientY - r.top) / r.height - 0.5;
      el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg)`;
    });
  };
  const onLeave = () => {
    cancelAnimationFrame(frameRef.current);
    rectRef.current = null;
    if (tiltRef.current) tiltRef.current.style.transform = "";
  };
  return (
    <div
      ref={tiltRef}
      className="card"
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={() => router.push(href)}
    >
      <div className="cover">
        <div className={"cover-bg " + game.cover} />
        <div className="label">{game.cat}</div>
      </div>
      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="desc">{game.short}</div>
        <div className="row">
          <div className="score-badge">
            <span>MEJOR PUNTUACIÓN</span>
            <b>{game.best.toLocaleString("es-ES")}</b>
          </div>
          <Link
            href={href}
            className={"btn" + BTN_COLOR[game.color]}
            onClick={(e) => e.stopPropagation()}
          >
            JUGAR
          </Link>
        </div>
      </div>
    </div>
  );
}
