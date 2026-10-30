"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import Link from "next/link";
import { use, useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { Photo } from "@/components/ui/Photo";
import { ProfileGate } from "@/components/studio/ProfileGate";
import type { Domain, Profile } from "@/lib/types";

interface Scored {
  name: string;
  affinity: number | null;
  image: string | null;
  year: number | null;
  found: boolean;
}
interface Result {
  plan: { songs: { artist: string; title: string }[]; films: string[]; stars: string[]; tv: string[]; brands: string[] };
  scores: Record<"music" | "film" | "stars", { generic: Scored[]; grounded: Scored[] }>;
}

const ROWS: { key: "music" | "film" | "stars"; label: string; domain: Domain }[] = [
  { key: "music", label: "Music", domain: "music" },
  { key: "film", label: "Films", domain: "film" },
  { key: "stars", label: "Faces", domain: "stars" },
];

function mean(items: Scored[]) {
  const vals = items.map((i) => i.affinity).filter((v): v is number => v !== null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function Column({ items, domain, tone }: { items: Scored[]; domain: Domain; tone: "plain" | "grounded" }) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.name} className="flex items-center gap-3 rounded-xl bg-umber-850/70 p-2.5">
          <Photo src={it.image} alt={it.name} domain={domain} className="size-11 shrink-0 rounded-md" develop={false} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-paper">{it.name}</p>
            {it.found ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-umber-700">
                  <span
                    className={clsx("block h-full rounded-full", tone === "grounded" ? "bg-amber" : "bg-smoke")}
                    style={{ width: `${Math.round((it.affinity ?? 0) * 100)}%` }}
                  />
                </span>
                <span className="w-9 text-right text-xs tabular-nums text-smoke">
                  {it.affinity === null ? "n/a" : Math.round(it.affinity * 100)}
                </span>
              </div>
            ) : (
              <p className="text-xs text-film">Not found in Qloo&apos;s graph</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Compare({ profile }: { profile: Profile }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const ids = (d: Domain) => profile.world.filter((w) => w.domain === d && !profile.seeds.includes(w.entityId)).map((w) => w.entityId).slice(0, 6);

  async function run() {
    setState("loading");
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          intake: profile.intake,
          seeds: profile.seeds,
          grounded: { music: ids("music"), film: ids("film"), stars: ids("stars") },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Comparison failed");
      setResult(json as Result);
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed");
      setState("error");
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 pb-28 pt-6 sm:px-8">
      <Link href={`/profile/${profile.id}`} className="text-paper-dim hover:text-paper">
        Back to {profile.intake.name}
      </Link>
      <h1 className="display mt-4 text-[clamp(2.6rem,6vw,4.6rem)]">Plain AI or a taste graph?</h1>
      <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-paper-dim">
        We give the same model the same facts about {profile.intake.name}, without Qloo, and ask for a reminiscence list. Then we
        score both lists against {profile.intake.name}&apos;s own taste signals in one Qloo call per domain, so the numbers are
        measured on the same scale. Higher means people who share {profile.intake.name}&apos;s taste love it more.
      </p>
      {state !== "done" && (
        <button
          type="button"
          onClick={() => void run()}
          disabled={state === "loading"}
          className="light-button mt-8 rounded-full px-7 py-3.5 text-lg font-semibold disabled:opacity-60"
        >
          {state === "loading" ? "Running both…" : "Run the comparison"}
        </button>
      )}
      {state === "error" && <p className="mt-4 text-film">{error}</p>}

      {result && (
        <div className="mt-12 space-y-14">
          {ROWS.map((row) => {
            const s = result.scores[row.key];
            const g = mean(s.generic);
            const q = mean(s.grounded);
            const missing = s.generic.filter((x) => !x.found).length;
            return (
              <motion.section key={row.key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-umber-800 pb-3">
                  <h2 className="display-soft text-[1.9rem]">{row.label}</h2>
                  <p className="text-paper-dim">
                    Average taste match: plain AI <strong className="text-paper">{g === null ? "n/a" : Math.round(g * 100)}</strong>, Madeleine{" "}
                    <strong className="text-amber-glow">{q === null ? "n/a" : Math.round(q * 100)}</strong>
                    {missing > 0 && `. ${missing} plain-AI pick${missing > 1 ? "s" : ""} not found in Qloo`}
                  </p>
                </div>
                <div className="mt-5 grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="mb-3 font-semibold text-smoke">Plain AI, same model, no Qloo</p>
                    <Column items={s.generic} domain={row.domain} tone="plain" />
                  </div>
                  <div>
                    <p className="mb-3 font-semibold text-amber">Madeleine, grounded in Qloo</p>
                    <Column items={s.grounded} domain={row.domain} tone="grounded" />
                  </div>
                </div>
              </motion.section>
            );
          })}
          <p className="max-w-[70ch] text-sm text-smoke">
            The plain list is what any chatbot produces for anyone born in {profile.intake.birthYear}. It also cannot reach brands,
            places to visit or a taste fingerprint, and it cannot learn from reactions. Madeleine&apos;s picks also pass through
            era, age and location filters before they reach a session.
          </p>
        </div>
      )}
    </main>
  );
}

export default function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <>
      <Nav />
      <ProfileGate id={id}>{(profile) => <Compare profile={profile} />}</ProfileGate>
    </>
  );
}
