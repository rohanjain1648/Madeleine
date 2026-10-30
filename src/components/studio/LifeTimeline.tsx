"use client";

import { useMemo, useState } from "react";
import type { Domain, Profile } from "@/lib/types";

// Validated with the dataviz palette checker against the umber surface (dark mode): all checks pass.
const LANES: { domain: Domain; label: string; color: string }[] = [
  { domain: "music", label: "Songs", color: "#b48c2b" },
  { domain: "film", label: "Films", color: "#c0401f" },
  { domain: "tv", label: "Television", color: "#339a83" },
  { domain: "books", label: "Books", color: "#7758bb" },
];

interface Mark {
  key: string;
  domain: Domain;
  label: string;
  year: number;
}

/** Their formative years as a strip plot: each song, film, show and book placed in the year it arrived. */
export function LifeTimeline({ profile }: { profile: Profile }) {
  const birth = profile.intake.birthYear;
  const [hover, setHover] = useState<(Mark & { x: number; y: number }) | null>(null);

  const marks = useMemo(() => {
    const out: Mark[] = [];
    for (const w of profile.world) {
      const e = profile.entities[w.entityId];
      if (!e) continue;
      if (w.domain === "music") {
        for (const t of w.tracks) if (t.year) out.push({ key: `${w.entityId}-${t.title}`, domain: "music", label: `${t.title}, ${t.artist}`, year: t.year });
      } else if ((w.domain === "film" || w.domain === "tv" || w.domain === "books") && e.year) {
        out.push({ key: w.entityId, domain: w.domain, label: e.name, year: e.year });
      }
    }
    return out;
  }, [profile]);

  const from = Math.min(birth, ...marks.map((m) => m.year));
  const to = Math.max(birth + 35, ...marks.map((m) => m.year)) + 1;
  const W = 960;
  const left = 110;
  const right = 24;
  const laneH = 52;
  const top = 34;
  const H = top + LANES.length * laneH + 40;
  const x = (year: number) => left + ((year - from) / (to - from)) * (W - left - right);

  // Spread marks that share a year so every one stays hoverable.
  const placed = useMemo(() => {
    const seen = new Map<string, number>();
    return marks.map((m) => {
      const k = `${m.domain}-${m.year}`;
      const n = seen.get(k) ?? 0;
      seen.set(k, n + 1);
      const lane = LANES.findIndex((l) => l.domain === m.domain);
      return { ...m, cx: x(m.year) + (n % 3) * 7 - (n > 0 ? 7 : 0), cy: top + lane * laneH + laneH / 2 + (n >= 3 ? 8 : n > 0 ? -8 : 0) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marks, from, to]);

  if (marks.length === 0) return null;

  const ticks: number[] = [];
  for (let y = Math.ceil(from / 5) * 5; y <= to; y += 5) ticks.push(y);

  return (
    <div className="relative">
      <div className="scrollbar-none overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[720px]" role="img" aria-label={`Timeline of ${profile.intake.name}'s formative years`}>
          <rect
            x={x(birth + 10)}
            y={top - 10}
            width={x(birth + 30) - x(birth + 10)}
            height={LANES.length * laneH + 10}
            fill="var(--color-amber)"
            opacity="0.07"
            rx="8"
          />
          <text x={x(birth + 20)} y={top - 16} textAnchor="middle" fontSize="12" fill="var(--color-smoke)">
            The years memory holds most vividly (ages 10 to 30)
          </text>
          {LANES.map((l, i) => (
            <g key={l.domain}>
              <line x1={left} x2={W - right} y1={top + i * laneH + laneH / 2} y2={top + i * laneH + laneH / 2} stroke="#3c2c24" strokeWidth="1" />
              <text x={0} y={top + i * laneH + laneH / 2 + 5} fontSize="14" fill="var(--color-paper-dim)">
                {l.label}
              </text>
            </g>
          ))}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={top + LANES.length * laneH} y2={top + LANES.length * laneH + 6} stroke="#5a4334" />
              <text x={x(t)} y={top + LANES.length * laneH + 22} textAnchor="middle" fontSize="12" fill="var(--color-smoke)">
                {t}
              </text>
              <text x={x(t)} y={top + LANES.length * laneH + 36} textAnchor="middle" fontSize="11" fill="#8d7c6c">
                {t - birth >= 0 ? `age ${t - birth}` : ""}
              </text>
            </g>
          ))}
          {placed.map((m) => {
            const lane = LANES.find((l) => l.domain === m.domain)!;
            return (
              <g key={m.key}>
                <circle
                  cx={m.cx}
                  cy={m.cy}
                  r={hover?.key === m.key ? 9 : 6.5}
                  fill={lane.color}
                  stroke="var(--color-umber-900)"
                  strokeWidth="2"
                  style={{ transition: "r .2s" }}
                />
                <circle
                  cx={m.cx}
                  cy={m.cy}
                  r={14}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${m.label}, ${m.year}`}
                  onPointerEnter={() => setHover({ ...m, x: m.cx, y: m.cy })}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover({ ...m, x: m.cx, y: m.cy })}
                  onBlur={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>
      </div>
      {hover && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-umber-600 bg-umber-950 px-3 py-2 text-sm shadow-xl"
          style={{ left: `${(hover.x / W) * 100}%`, top: `calc(${(hover.y / H) * 100}% - 14px)` }}
        >
          <p className="font-semibold text-paper">{hover.label}</p>
          <p className="text-smoke">
            {hover.year}, when {profile.intake.name} was {hover.year - birth}
          </p>
        </div>
      )}
    </div>
  );
}
