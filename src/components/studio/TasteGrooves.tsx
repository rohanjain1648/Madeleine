"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import { useState } from "react";
import type { TasteTag } from "@/lib/types";

function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const rad = (d: number) => ((d - 90) * Math.PI) / 180;
  const sx = cx + r * Math.cos(rad(from));
  const sy = cy + r * Math.sin(rad(from));
  const ex = cx + r * Math.cos(rad(to));
  const ey = cy + r * Math.sin(rad(to));
  return `M ${sx} ${sy} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${ex} ${ey}`;
}

/**
 * Qloo's taste analysis drawn as the grooves of a record: one groove per tag,
 * the lit length of each groove is its weight. The ranked list beside it is the
 * readable version of the same numbers.
 */
export function TasteGrooves({ tags, name }: { tags: TasteTag[]; name: string }) {
  const top = [...tags].sort((a, b) => b.weight - a.weight).slice(0, 14);
  const [hover, setHover] = useState<number | null>(null);
  if (top.length === 0) return <p className="text-smoke">Qloo didn&apos;t return a taste fingerprint for this profile.</p>;

  const cx = 180;
  const outer = 168;
  const inner = 72;
  const step = (outer - inner) / top.length;

  return (
    <div className="grid items-center gap-10 md:grid-cols-[minmax(0,380px)_1fr]">
      <svg viewBox="0 0 360 360" className="w-full max-w-[380px]" role="img" aria-label={`${name}'s taste fingerprint from Qloo`}>
        <circle cx={cx} cy={cx} r={outer + 8} fill="#0f0a08" />
        {top.map((t, i) => {
          const r = outer - i * step - step / 2;
          const on = hover === null || hover === i;
          return (
            <g key={t.name} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
              <circle cx={cx} cy={cx} r={r} fill="none" stroke="#2b1f1a" strokeWidth={step * 0.62} />
              <motion.path
                d={arc(cx, cx, r, 0, Math.max(8, t.weight * 330))}
                fill="none"
                stroke="var(--color-amber)"
                strokeLinecap="round"
                strokeWidth={step * 0.62}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                style={{ opacity: on ? 0.35 + t.weight * 0.65 : 0.12 }}
              >
                <title>{`${t.name}: ${Math.round(t.weight * 100)}`}</title>
              </motion.path>
            </g>
          );
        })}
        <circle cx={cx} cy={cx} r={inner - 6} fill="var(--color-film)" />
        <circle cx={cx} cy={cx} r={inner - 12} fill="none" stroke="#1b1310" strokeOpacity=".25" />
        <text x={cx} y={cx - 8} textAnchor="middle" className="display-soft" fontSize="15" fill="#1b1310">
          {name}&apos;s taste
        </text>
        <text x={cx} y={cx + 14} textAnchor="middle" fontSize="12" fill="#1b1310" opacity=".8">
          {hover !== null ? top[hover].name : top[0].name}
        </text>
        <circle cx={cx} cy={cx} r="4" fill="#1b1310" />
      </svg>

      <ol className="space-y-1.5" aria-label="Taste tags by strength">
        {top.map((t, i) => (
          <li
            key={t.name}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            className={clsx(
              "grid grid-cols-[minmax(0,11rem)_1fr_2.5rem] items-center gap-3 rounded-md px-2 py-1 transition-colors",
              hover === i && "bg-paper/5",
            )}
          >
            <span className="truncate text-[0.95rem] text-paper">{t.name}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-umber-800">
              <span className="block h-full rounded-full bg-amber" style={{ width: `${Math.max(4, t.weight * 100)}%` }} />
            </span>
            <span className="text-right text-sm tabular-nums text-smoke">{Math.round(t.weight * 100)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
