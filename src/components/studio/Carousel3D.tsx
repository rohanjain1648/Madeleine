"use client";

import { useEffect, useRef, useState } from "react";
import type { Domain } from "@/lib/types";
import { Photo } from "../ui/Photo";

interface Item {
  id: string;
  name: string;
  image: string | null;
  domain: Domain;
}

/** Their world on a slowly turning drum, like a carousel slide projector. Drag to spin it. */
export function Carousel3D({ items }: { items: Item[] }) {
  const shown = items.slice(0, 16);
  const n = Math.max(shown.length, 6);
  const card = 170;
  const radius = Math.round(card / 2 / Math.tan(Math.PI / n)) + 40;
  const drum = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const drag = useRef<{ x: number; a: number } | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!drag.current && !reduced) angle.current -= dt * 7;
      if (drum.current) drum.current.style.transform = `translateZ(-${radius}px) rotateY(${angle.current}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [radius, reduced]);

  if (shown.length === 0) return null;

  return (
    <div
      className="relative h-[330px] touch-pan-y select-none overflow-hidden [perspective:1300px] sm:h-[360px]"
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, a: angle.current };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (drag.current) angle.current = drag.current.a + (e.clientX - drag.current.x) * 0.25;
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      aria-label="Their world on a turning carousel. Drag to spin."
      role="group"
    >
      <div className="absolute left-1/2 top-1/2 h-[230px] w-[170px] -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]">
        <div ref={drum} className="absolute inset-0 [transform-style:preserve-3d]">
          {shown.map((it, i) => (
            <figure
              key={it.id}
              className="absolute inset-0 [backface-visibility:hidden]"
              style={{ transform: `rotateY(${(360 / n) * i}deg) translateZ(${radius}px)` }}
            >
              <div className="polaroid h-full">
                <Photo src={it.image} alt={it.name} domain={it.domain} className="aspect-square" develop={false} />
                <figcaption className="display-soft mt-2 line-clamp-2 text-center text-[0.95rem] italic leading-tight text-umber-800">
                  {it.name}
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-umber-900 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l from-umber-900 to-transparent" />
    </div>
  );
}
