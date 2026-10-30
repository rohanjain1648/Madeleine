"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { AgentTheater } from "../agent/AgentTheater";
import { updateProfile } from "@/lib/store";
import { streamAgent } from "@/lib/stream-client";
import { REACTIONS, type AgentEvent, type Profile, type Reaction, type Session } from "@/lib/types";

const REACTION_COLOR: Record<Reaction, string> = {
  lit: "bg-lit",
  engaged: "bg-engaged",
  neutral: "bg-neutral",
  distressed: "bg-distressed",
};

function minutes(s: Session) {
  return s.moments.reduce((sum, m) => sum + m.minutes, 0);
}

function ReactionSummary({ session }: { session: Session }) {
  const counts = REACTIONS.map((r) => ({ ...r, n: session.moments.filter((m) => session.reactions[m.id] === r.id).length }));
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-paper-dim">
      {counts
        .filter((c) => c.n > 0)
        .map((c) => (
          <li key={c.id} className="flex items-center gap-1.5">
            <span className={clsx("size-2.5 rounded-full", REACTION_COLOR[c.id])} aria-hidden />
            {c.label} {c.n}
          </li>
        ))}
    </ul>
  );
}

export function Sessions({ profile }: { profile: Profile }) {
  const [planning, setPlanning] = useState(false);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const latest = profile.sessions[profile.sessions.length - 1];
  const canPlan = !!latest?.completedAt;

  async function planNext() {
    setPlanning(true);
    setEvents([]);
    setError(null);
    setStartedAt(Date.now());
    try {
      let done = false;
      await streamAgent("/api/adapt", { profile, sessionId: latest.id }, (e) => {
        setEvents((prev) => [...prev, e]);
        if (e.type === "error") setError(e.message);
        if (e.type === "session") {
          done = true;
          updateProfile(profile.id, (p) => ({
            ...p,
            entities: { ...p.entities, ...e.entities },
            world: [...p.world, ...e.world.filter((w) => !p.world.some((x) => x.entityId === w.entityId))],
            learned: e.learned,
            sessions: [...p.sessions, e.session],
          }));
          setTimeout(() => setPlanning(false), 1200);
        }
      });
      if (!done) setError((prev) => prev ?? "The agents stopped before finishing. Please try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div>
      <ol className="grid gap-4 md:grid-cols-2">
        {[...profile.sessions].reverse().map((s) => (
          <li key={s.id} className={clsx("rounded-2xl border p-6", s.completedAt ? "border-umber-700 bg-umber-850/60" : "border-amber/40 bg-umber-850")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-smoke">
                  Session {s.number}, about {minutes(s)} minutes
                </p>
                <h3 className="display-soft mt-1 text-[1.6rem] leading-tight text-paper">{s.title}</h3>
              </div>
              <Link
                href={`/profile/${profile.id}/session?s=${s.id}`}
                className={clsx(
                  "shrink-0 rounded-full px-4 py-2 font-semibold",
                  s.completedAt ? "border border-umber-600 text-paper-dim hover:text-paper" : "light-button",
                )}
              >
                {s.completedAt ? "Play again" : "Start"}
              </Link>
            </div>
            <p className="mt-3 leading-relaxed text-paper-dim">{s.theme}</p>
            {s.learned.length > 0 && (
              <div className="mt-4 rounded-xl bg-umber-950/50 p-4">
                <p className="text-sm font-semibold text-amber">What Madeleine learned from session {s.number - 1}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.95rem] text-paper-dim">
                  {s.learned.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            )}
            {s.completedAt && (
              <div className="mt-4">
                <ReactionSummary session={s} />
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={!canPlan}
          onClick={() => void planNext()}
          className="light-button rounded-full px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          Plan session {(latest?.number ?? 0) + 1} from their reactions
        </button>
        {!canPlan && <p className="text-sm text-smoke">Finish session {latest?.number} first. Madeleine learns from how it went.</p>}
      </div>

      <AnimatePresence>
        {planning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-umber-950/95 pt-10 backdrop-blur"
            role="dialog"
            aria-modal="true"
            aria-label="Planning the next session"
          >
            <div className="mx-auto flex max-w-[1240px] justify-end px-5 sm:px-8">
              <button type="button" onClick={() => setPlanning(false)} className="rounded-full px-4 py-2 text-paper-dim hover:text-paper">
                Close
              </button>
            </div>
            <AgentTheater
              title={`Planning session ${(latest?.number ?? 0) + 1}`}
              events={events}
              startedAt={startedAt}
              error={error}
              onRetry={() => void planNext()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
