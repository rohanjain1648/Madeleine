"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentEvent, ToolPreview } from "@/lib/types";
import { TOOL_LABEL } from "@/lib/domains";
import { Photo } from "../ui/Photo";

type Phase = "idle" | "curate" | "design" | "hydrate" | "reflect" | "done";

interface ToolRow {
  id: string;
  name: string;
  intent: string;
  status: "running" | "done" | "error";
  summary?: string;
  ms?: number;
  preview: ToolPreview[];
}

const STATIONS = [
  { key: "words", label: "Family's words" },
  { key: "agent", label: "Curator agent" },
  { key: "qloo", label: "Qloo taste graph" },
  { key: "designer", label: "Designer agent" },
  { key: "session", label: "Session" },
] as const;

function activeStations(phase: Phase, running: boolean): Set<string> {
  switch (phase) {
    case "curate":
    case "reflect":
      return new Set(running ? ["agent", "qloo"] : ["agent"]);
    case "design":
      return new Set(["designer"]);
    case "hydrate":
      return new Set(["session"]);
    case "done":
      return new Set(STATIONS.map((s) => s.key));
    default:
      return new Set(["words"]);
  }
}

export function useAgentTimeline(events: AgentEvent[]) {
  return useMemo(() => {
    const tools = new Map<string, ToolRow>();
    const thoughts: string[] = [];
    let phase: Phase = "idle";
    let label = "";
    for (const e of events) {
      if (e.type === "phase") {
        phase = e.phase;
        label = e.label;
      } else if (e.type === "tool-start") {
        tools.set(e.id, { id: e.id, name: e.name, intent: e.intent, status: "running", preview: [] });
      } else if (e.type === "tool-end") {
        const t = tools.get(e.id);
        tools.set(e.id, { ...(t ?? { id: e.id, name: e.name, intent: "" }), status: "done", summary: e.summary, ms: e.ms, preview: e.preview });
      } else if (e.type === "tool-error") {
        const t = tools.get(e.id);
        tools.set(e.id, { ...(t ?? { id: e.id, name: e.name, intent: "", preview: [] }), status: "error", summary: e.summary });
      } else if (e.type === "thought") {
        thoughts.push(e.text);
      }
    }
    const rows = [...tools.values()];
    const seen = new Set<string>();
    const developed = rows
      .flatMap((r) => r.preview)
      .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
    return { rows, thoughts, phase, label, developed, running: rows.some((r) => r.status === "running") };
  }, [events]);
}

function Elapsed({ since, stopped }: { since: number; stopped: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (stopped) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [stopped]);
  return <span className="tabular-nums">{Math.max(0, (now - since) / 1000).toFixed(1)}s</span>;
}

export function AgentTheater({
  title,
  events,
  startedAt,
  error,
  onRetry,
}: {
  title: string;
  events: AgentEvent[];
  startedAt: number;
  error?: string | null;
  onRetry?: () => void;
}) {
  const { rows, thoughts, phase, label, developed, running } = useAgentTimeline(events);
  const active = activeStations(phase, running);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stripRef.current?.scrollTo({ top: stripRef.current.scrollHeight, behavior: "smooth" });
  }, [rows.length, thoughts.length]);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 pb-16 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[clamp(2.4rem,6vw,4.4rem)]">{title}</h1>
          <p className="mt-3 text-lg text-paper-dim" aria-live="polite">
            {error ? "Something went wrong." : label || "Warming up the projector"}
          </p>
        </div>
        <dl className="flex gap-6 text-right">
          <div>
            <dt className="text-sm text-smoke">Qloo calls</dt>
            <dd className="display text-3xl tabular-nums">{rows.filter((r) => r.status !== "running").length}</dd>
          </div>
          <div>
            <dt className="text-sm text-smoke">Things found</dt>
            <dd className="display text-3xl tabular-nums">{developed.length}</dd>
          </div>
          <div>
            <dt className="text-sm text-smoke">Elapsed</dt>
            <dd className="display text-3xl">
              <Elapsed since={startedAt} stopped={phase === "done" || !!error} />
            </dd>
          </div>
        </dl>
      </div>

      {/* The pipeline, lit station by station. */}
      <ol className="mt-10 grid grid-cols-5 items-start gap-1" aria-label="Agent pipeline">
        {STATIONS.map((s, i) => {
          const on = active.has(s.key);
          const past = STATIONS.findIndex((x) => active.has(x.key)) > i || phase === "done";
          return (
            <li key={s.key} className="relative flex flex-col items-center text-center">
              {i < STATIONS.length - 1 && (
                <div className="absolute left-1/2 top-[22px] h-px w-full overflow-hidden bg-umber-700">
                  {(on || past) && (
                    <motion.div
                      className="h-px w-1/3 bg-gradient-to-r from-transparent via-amber-glow to-transparent"
                      animate={{ x: ["-100%", "300%"] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </div>
              )}
              <motion.div
                className={clsx(
                  "relative z-10 grid size-11 place-items-center rounded-full border text-sm font-bold transition-colors duration-500",
                  on ? "border-amber bg-amber text-umber-950" : past ? "border-amber/60 bg-umber-800 text-amber" : "border-umber-600 bg-umber-850 text-smoke",
                )}
                animate={on && phase !== "done" ? { boxShadow: ["0 0 0px rgba(242,165,59,0)", "0 0 28px rgba(242,165,59,.65)", "0 0 0px rgba(242,165,59,0)"] } : {}}
                transition={{ duration: 1.6, repeat: Infinity }}
              >
                {i + 1}
              </motion.div>
              <span className={clsx("mt-2 text-[0.8rem] leading-tight sm:text-sm", on ? "text-paper" : "text-smoke")}>{s.label}</span>
            </li>
          );
        })}
      </ol>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Film strip of tool calls. */}
        <section aria-label="What the agents are doing" className="relative">
          <div
            ref={stripRef}
            className="scrollbar-none relative max-h-[56vh] overflow-y-auto rounded-xl border-x-[14px] border-umber-950 bg-umber-950 py-2 [border-image:repeating-linear-gradient(180deg,#120c0a_0_10px,#3c2c24_10px_18px)_14]"
          >
            <AnimatePresence initial={false}>
              {rows.map((r) => (
                <motion.article
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="mx-2 my-2 rounded-lg bg-umber-850 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-paper">{TOOL_LABEL[r.name] ?? r.name}</h3>
                    <span className="text-sm tabular-nums text-smoke">
                      {r.status === "running" ? (
                        <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}>
                          working
                        </motion.span>
                      ) : r.status === "error" ? (
                        <span className="text-film">retrying</span>
                      ) : (
                        `${r.ms} ms`
                      )}
                    </span>
                  </div>
                  {r.intent && <p className="display-soft mt-1 text-[1.02rem] italic text-paper-dim">“{r.intent}”</p>}
                  {r.summary && <p className="mt-2 text-sm text-smoke">{r.summary}</p>}
                  {r.preview.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-hidden">
                      {r.preview.slice(0, 6).map((p) => (
                        <Photo key={p.id} src={p.image} alt={p.name} domain={p.domain ?? "film"} className="size-12 shrink-0 rounded" />
                      ))}
                    </div>
                  )}
                </motion.article>
              ))}
              {thoughts.slice(-2).map((t, i) => (
                <motion.p
                  key={`th-${thoughts.length - 2 + i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="display-soft mx-4 my-3 text-[1.05rem] italic text-amber-glow/90"
                >
                  {t}
                </motion.p>
              ))}
            </AnimatePresence>
            {rows.length === 0 && !error && (
              <p className="px-4 py-10 text-center text-smoke">The Curator is reading the family&apos;s words…</p>
            )}
          </div>
        </section>

        {/* The developing tray. */}
        <section aria-label="Their world, developing" className="rounded-xl bg-umber-950/60 p-4">
          <h2 className="display-soft text-xl text-paper">Developing</h2>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5">
            <AnimatePresence>
              {developed.slice(0, 40).map((p) => (
                <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} title={p.name}>
                  <Photo src={p.image} alt={p.name} domain={p.domain ?? "film"} className="aspect-square rounded-md" />
                </motion.div>
              ))}
            </AnimatePresence>
            {developed.length === 0 &&
              Array.from({ length: 10 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="aspect-square rounded-md bg-umber-800"
                  animate={{ opacity: [0.25, 0.6, 0.25] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.12 }}
                />
              ))}
          </div>
        </section>
      </div>

      {error && (
        <div role="alert" className="mt-8 rounded-xl border border-film/40 bg-film/10 p-5">
          <p className="font-semibold text-paper">{error}</p>
          {onRetry && (
            <button type="button" onClick={onRetry} className="light-button mt-4 rounded-full px-5 py-2.5 font-semibold">
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
