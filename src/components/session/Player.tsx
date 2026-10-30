"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, ExternalLink, Pause, Play, Volume2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Photo } from "../ui/Photo";
import { ShellMark } from "../ui/Wordmark";
import { isPlaying, useAudio } from "../ui/Audio";
import { KIND_DOMAIN, KIND_LABEL } from "@/lib/domains";
import { updateProfile } from "@/lib/store";
import { REACTIONS, type Moment, type Profile, type Reaction, type Session } from "@/lib/types";

const LANG: Record<string, string> = {
  english: "en-US",
  spanish: "es-MX",
  hindi: "hi-IN",
  french: "fr-FR",
  italian: "it-IT",
  portuguese: "pt-BR",
  german: "de-DE",
  mandarin: "zh-CN",
  cantonese: "zh-HK",
  tagalog: "fil-PH",
  polish: "pl-PL",
  arabic: "ar-SA",
  japanese: "ja-JP",
  korean: "ko-KR",
};

function speak(text: string, language: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG[language.toLowerCase()] ?? "en-US";
  u.rate = 0.88;
  window.speechSynthesis.speak(u);
}

const REACTION_STYLE: Record<Reaction, string> = {
  lit: "border-lit bg-lit text-umber-950",
  engaged: "border-engaged bg-engaged text-umber-950",
  neutral: "border-neutral bg-neutral text-umber-950",
  distressed: "border-distressed bg-distressed text-umber-950",
};

function Turntable({ moment }: { moment: Moment }) {
  const audio = useAudio();
  const track = moment.track;
  const on = isPlaying(audio, track);
  const art = track?.artwork ?? null;
  return (
    <div className="flex flex-col items-center">
      <div className="relative aspect-square w-[min(68vw,440px)]">
        <div
          className={clsx("vinyl absolute inset-0", on && "animate-spin-slow")}
          style={{ ["--label" as string]: "var(--color-music)", animationPlayState: on ? "running" : "paused" }}
        >
          <div className="absolute left-1/2 top-1/2 size-[34%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full">
            <Photo src={art} alt={track?.title ?? moment.title} domain="music" className="size-full" develop={false} />
          </div>
          <div className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-umber-950" />
        </div>
        <motion.div
          aria-hidden
          className="absolute -right-[6%] -top-[4%] h-[62%] w-[10%] origin-[50%_6%]"
          animate={{ rotate: on ? 24 : 4 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mx-auto size-[42px] rounded-full bg-gradient-to-br from-paper-dim to-smoke shadow-lg" />
          <div className="mx-auto -mt-2 h-full w-[6px] rounded-full bg-gradient-to-b from-paper-dim to-smoke" />
        </motion.div>
      </div>
      {track?.previewUrl ? (
        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => audio.toggle(track)}
            className="light-button flex items-center gap-3 rounded-full px-8 py-4 text-xl font-semibold"
          >
            {on ? <Pause className="size-6" fill="currentColor" /> : <Play className="size-6" fill="currentColor" />}
            {on ? "Pause" : "Play the song"}
          </button>
          <div className="flex h-10 items-end gap-1" aria-hidden>
            {Array.from({ length: 28 }).map((_, i) => (
              <span
                key={i}
                className="w-1.5 origin-bottom rounded-full bg-amber/80"
                style={{
                  height: "100%",
                  transform: on ? undefined : "scaleY(0.12)",
                  animation: on ? `eq ${0.55 + ((i * 37) % 9) / 14}s ${(i % 5) * 0.08}s ease-in-out infinite alternate` : "none",
                }}
              />
            ))}
          </div>
          <style>{`@keyframes eq { from { transform: scaleY(.15) } to { transform: scaleY(1) } }`}</style>
        </div>
      ) : (
        <p className="mt-6 max-w-[34ch] text-center text-paper-dim">No preview is available for this recording. Search for it on your favourite music app and play it here.</p>
      )}
      {track?.url && (
        <a href={track.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-smoke hover:text-paper">
          Full song on Apple Music <ExternalLink className="size-3.5" />
        </a>
      )}
    </div>
  );
}

function Visual({ moment, profile }: { moment: Moment; profile: Profile }) {
  const entity = moment.entityId ? profile.entities[moment.entityId] : undefined;
  if (moment.kind === "song") return <Turntable moment={moment} />;
  if (moment.kind === "story" || moment.kind === "sensory" || !entity) {
    return (
      <div className="flex aspect-[4/3] w-full max-w-[560px] flex-col items-center justify-center rounded-[28px] bg-[radial-gradient(80%_70%_at_50%_30%,rgb(255_207_122/0.25),transparent),var(--color-umber-850)] p-10 text-center">
        <ShellMark className="size-16 text-amber" />
        <p className="display mt-6 text-[clamp(2rem,4vw,3rem)] leading-tight text-paper">{moment.sensory ?? moment.title}</p>
      </div>
    );
  }
  const domain = KIND_DOMAIN[moment.kind] ?? entity.domain;
  return (
    <figure className={clsx("w-full max-w-[600px]", domain === "stars" ? "polaroid" : domain === "film" ? "slide-mount" : domain === "tv" ? "crt" : "")}>
      <div className={clsx("overflow-hidden", domain === "film" ? "slide-window" : domain === "tv" ? "crt-screen" : "rounded-2xl")}>
        <Photo src={entity.image} alt={entity.name} domain={entity.domain} className="aspect-[4/3]" imgClassName="animate-kenburns" />
      </div>
      <figcaption className={clsx("display-soft mt-3 text-center text-xl italic", domain === "stars" || domain === "film" ? "text-umber-800" : "text-paper-dim")}>
        {entity.name}
        {entity.year ? `, ${entity.year}` : ""}
      </figcaption>
    </figure>
  );
}

export function Player({ profile, session }: { profile: Profile; session: Session }) {
  const audio = useAudio();
  const [index, setIndex] = useState(0);
  const [reactions, setReactions] = useState<Record<string, Reaction>>(session.reactions);
  const [notes, setNotes] = useState<Record<string, string>>(session.notes);
  const done = index >= session.moments.length;
  const moment = session.moments[Math.min(index, session.moments.length - 1)];
  const language = profile.intake.language || "English";

  const persist = useCallback(
    (patch: Partial<Session>) =>
      updateProfile(profile.id, (p) => ({
        ...p,
        sessions: p.sessions.map((s) => (s.id === session.id ? { ...s, ...patch } : s)),
      })),
    [profile.id, session.id],
  );

  const react = useCallback(
    (r: Reaction) => {
      if (!moment) return;
      const next = { ...reactions, [moment.id]: r };
      setReactions(next);
      persist({ reactions: next });
    },
    [moment, reactions, persist],
  );

  const go = useCallback(
    (delta: number) => {
      audio.stop();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      setIndex((i) => {
        const n = Math.max(0, Math.min(session.moments.length, i + delta));
        if (n === session.moments.length) persist({ completedAt: new Date().toISOString() });
        return n;
      });
    },
    [audio, persist, session.moments.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      const r = REACTIONS[Number(e.key) - 1];
      if (r && !done) react(r.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, react, done]);

  const summary = useMemo(
    () => REACTIONS.map((r) => ({ ...r, moments: session.moments.filter((m) => reactions[m.id] === r.id) })),
    [reactions, session.moments],
  );

  return (
    <div className="flex min-h-[100svh] flex-col">
      <header className="no-print flex items-center gap-4 px-5 py-4 sm:px-8">
        <Link href={`/profile/${profile.id}`} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-paper-dim hover:text-paper">
          <X className="size-5" /> End
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-smoke">
            Session {session.number} with {profile.intake.name}: {session.title}
          </p>
          <div className="mt-1.5 flex gap-1">
            {session.moments.map((m, i) => (
              <span
                key={m.id}
                className={clsx(
                  "h-1 flex-1 rounded-full transition-colors duration-700",
                  i < index ? "bg-amber" : i === index ? "bg-amber-glow" : "bg-umber-700",
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.main
            key={moment.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
            className="mx-auto grid w-full max-w-[1320px] flex-1 items-center gap-10 px-5 py-6 sm:px-8 lg:grid-cols-[1.05fr_1fr]"
          >
            <div className="flex justify-center">
              <Visual moment={moment} profile={profile} />
            </div>
            <div>
              <p className="text-lg text-amber">{KIND_LABEL[moment.kind]}</p>
              <h1 className="display mt-2 text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.02]">{moment.title}</h1>
              <ul className="mt-8 space-y-5">
                {moment.prompts.map((p) => (
                  <li key={p} className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => speak(p, language)}
                      className="mt-1 grid size-10 shrink-0 place-items-center rounded-full bg-umber-800 text-paper-dim transition-colors hover:bg-amber hover:text-umber-950"
                      aria-label="Read this aloud"
                    >
                      <Volume2 className="size-5" />
                    </button>
                    <p className="text-[clamp(1.25rem,2.1vw,1.6rem)] leading-snug text-paper">{p}</p>
                  </li>
                ))}
              </ul>
              {moment.sensory && moment.kind !== "sensory" && (
                <p className="mt-6 rounded-xl bg-umber-850 px-5 py-4 text-paper-dim">
                  <span className="font-semibold text-paper">Bring along: </span>
                  {moment.sensory}
                </p>
              )}
              <p className="mt-6 border-l-2 border-amber/60 pl-4 text-[1.02rem] leading-relaxed text-paper-dim">
                <span className="font-semibold text-paper">For you: </span>
                {moment.caregiverTip}
              </p>
            </div>
          </motion.main>
        ) : (
          <motion.main
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto w-full max-w-[880px] flex-1 px-5 py-12 sm:px-8"
          >
            <h1 className="display text-[clamp(2.6rem,6vw,4.6rem)]">Thank you for sitting with {profile.intake.name}.</h1>
            <p className="mt-5 text-lg text-paper-dim">
              Here is how it went. Madeleine will use this to plan the next session: more of what made them light up, nothing that
              upset them.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {summary
                .filter((s) => s.moments.length > 0)
                .map((s) => (
                  <div key={s.id} className="rounded-2xl bg-umber-850 p-5">
                    <p className="font-semibold text-paper">{s.label}</p>
                    <ul className="mt-2 space-y-1 text-paper-dim">
                      {s.moments.map((m) => (
                        <li key={m.id}>{m.title}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href={`/profile/${profile.id}#sessions`} className="light-button rounded-full px-6 py-3 font-semibold">
                Plan the next session
              </Link>
              <button type="button" onClick={() => setIndex(0)} className="rounded-full border border-umber-600 px-6 py-3 text-paper-dim hover:text-paper">
                Go through it again
              </button>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {!done && (
        <footer className="no-print sticky bottom-0 border-t border-umber-800 bg-umber-900/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center gap-3 px-5 py-4 sm:px-8">
            <p className="w-full text-sm text-smoke sm:w-auto">How did {profile.intake.name} respond?</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Reaction">
              {REACTIONS.map((r, i) => {
                const on = reactions[moment.id] === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    title={`${r.hint} (key ${i + 1})`}
                    onClick={() => react(r.id)}
                    className={clsx(
                      "rounded-full border px-4 py-2.5 font-semibold transition-colors",
                      on ? REACTION_STYLE[r.id] : "border-umber-600 text-paper-dim hover:border-paper/50 hover:text-paper",
                    )}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
            <input
              value={notes[moment.id] ?? ""}
              onChange={(e) => setNotes((n) => ({ ...n, [moment.id]: e.target.value }))}
              onBlur={() => persist({ notes })}
              placeholder="Anything they said? (optional)"
              className="min-w-0 flex-1 rounded-full border border-umber-600 bg-umber-950/50 px-4 py-2.5 text-paper placeholder:text-smoke/70 focus:border-amber focus:outline-none"
            />
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={index === 0}
                className="grid size-12 place-items-center rounded-full border border-umber-600 text-paper-dim hover:text-paper disabled:opacity-30"
                aria-label="Previous moment"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={() => {
                  persist({ notes });
                  go(1);
                }}
                className="light-button flex items-center gap-1 rounded-full px-5 py-3 font-semibold"
              >
                {index === session.moments.length - 1 ? "Finish" : "Next"}
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
