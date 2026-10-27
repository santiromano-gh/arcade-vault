"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
// Aparición al hacer scroll. El HTML del servidor llega visible; `.reveal` se
// añade solo en el efecto (tras hidratar), así no hay desajuste de hidratación
// ni contenido oculto si falla el JS. Sin IntersectionObserver o con
// prefers-reduced-motion el contenido se queda visible tal cual.
export function Reveal({
  className,
  style,
  children,
}: {
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    el.classList.add("reveal");
    io.observe(el);
    return () => {
      io.disconnect();
      el.classList.remove("reveal", "in");
    };
  }, []);
  return (
    <section ref={ref} className={className} style={style}>
      {children}
    </section>
  );
}
