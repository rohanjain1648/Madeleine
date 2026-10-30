"use client";

import clsx from "clsx";
import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DEMO_PEOPLE } from "@/lib/demo";
import type { Intake } from "@/lib/types";

export const EMPTY_INTAKE: Intake = {
  name: "",
  birthYear: 1945,
  hometown: "",
  currentCity: "",
  language: "English",
  loves: "",
  lifeStory: "",
  avoid: "",
};

interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
}

function getRecognition(): Recognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

/** Lets a family member talk instead of type, which is often easier when the memories come in a rush. */
function DictateButton({ onText }: { onText: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const rec = useRef<Recognition | null>(null);

  useEffect(() => {
    setSupported(!!getRecognition());
  }, []);

  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (listening) {
          rec.current?.stop();
          return;
        }
        const r = getRecognition();
        if (!r) return;
        r.lang = navigator.language || "en-US";
        r.interimResults = false;
        r.continuous = true;
        r.onresult = (e) => {
          const last = e.results[e.results.length - 1];
          if (last?.[0]?.transcript) onText(last[0].transcript.trim());
        };
        r.onend = () => setListening(false);
        rec.current = r;
        r.start();
        setListening(true);
      }}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
        listening ? "bg-film text-paper" : "bg-umber-700/70 text-paper-dim hover:text-paper",
      )}
      aria-pressed={listening}
    >
      {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
      {listening ? "Stop" : "Speak instead"}
    </button>
  );
}

const field =
  "w-full rounded-xl border border-umber-600/70 bg-umber-950/50 px-4 py-3 text-[1.05rem] text-paper placeholder:text-smoke/70 transition-colors focus:border-amber focus:outline-none";

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <span className="mb-1.5 block">
      <span className="font-semibold text-paper">{children}</span>
      {hint && <span className="ml-2 text-sm text-smoke">{hint}</span>}
    </span>
  );
}

export function IntakeForm({
  initial,
  onSubmit,
  busy,
}: {
  initial: Intake;
  onSubmit: (intake: Intake) => void;
  busy: boolean;
}) {
  const [v, setV] = useState<Intake>(initial);
  useEffect(() => setV(initial), [initial]);
  const set = <K extends keyof Intake>(k: K, value: Intake[K]) => setV((prev) => ({ ...prev, [k]: value }));
  const append = (k: "loves" | "lifeStory" | "avoid") => (text: string) =>
    setV((prev) => ({ ...prev, [k]: prev[k] ? `${prev[k]}, ${text}` : text }));
  const ready = v.name.trim() && v.hometown.trim() && v.loves.trim().length > 2 && v.birthYear > 1900;

  return (
    <form
      className="space-y-7"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready && !busy) onSubmit(v);
      }}
    >
      <div>
        <p className="text-sm text-smoke">Or try someone we made up:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEMO_PEOPLE.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setV(d.intake)}
              className="rounded-full border border-umber-600 px-3.5 py-1.5 text-sm text-paper-dim transition-colors hover:border-amber hover:text-paper"
            >
              {d.intake.name}, {d.intake.birthYear}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1.4fr_1fr]">
        <label className="block">
          <Label>What do they like to be called?</Label>
          <input className={field} value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Rose" required maxLength={60} />
        </label>
        <label className="block">
          <Label>Year they were born</Label>
          <input
            className={field}
            type="number"
            inputMode="numeric"
            min={1915}
            max={2005}
            value={v.birthYear}
            onChange={(e) => set("birthYear", Number(e.target.value))}
            required
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <Label>Where they grew up</Label>
          <input className={field} value={v.hometown} onChange={(e) => set("hometown", e.target.value)} placeholder="Brooklyn, New York" required maxLength={120} />
        </label>
        <label className="block">
          <Label hint="for outings">Where they live now</Label>
          <input className={field} value={v.currentCity} onChange={(e) => set("currentCity", e.target.value)} placeholder="Boca Raton, Florida" maxLength={120} />
        </label>
      </div>

      <label className="block">
        <span className="flex items-end justify-between gap-3">
          <Label hint="singers, films, shows, foods, places">What did they love?</Label>
          <DictateButton onText={append("loves")} />
        </span>
        <textarea
          className={clsx(field, "min-h-28 resize-y")}
          value={v.loves}
          onChange={(e) => set("loves", e.target.value)}
          placeholder="Ella Fitzgerald, Roman Holiday, I Love Lucy, egg creams, Coney Island…"
          required
          maxLength={1200}
        />
      </label>

      <label className="block">
        <span className="flex items-end justify-between gap-3">
          <Label hint="work, family, hobbies">A little of their story</Label>
          <DictateButton onText={append("lifeStory")} />
        </span>
        <textarea
          className={clsx(field, "min-h-24 resize-y")}
          value={v.lifeStory}
          onChange={(e) => set("lifeStory", e.target.value)}
          placeholder="Seamstress in the Garment District for thirty years. Married Sol in 1963…"
          maxLength={1200}
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-[1fr_2fr]">
        <label className="block">
          <Label>Language for prompts</Label>
          <input className={field} value={v.language} onChange={(e) => set("language", e.target.value)} list="languages" maxLength={40} />
          <datalist id="languages">
            {["English", "Spanish", "Hindi", "French", "Italian", "Portuguese", "German", "Mandarin", "Cantonese", "Tagalog", "Polish", "Yiddish", "Arabic", "Japanese", "Korean"].map(
              (l) => (
                <option key={l} value={l} />
              ),
            )}
          </datalist>
        </label>
        <label className="block">
          <Label hint="topics that upset them">Anything to avoid?</Label>
          <input className={field} value={v.avoid} onChange={(e) => set("avoid", e.target.value)} placeholder="Hospitals. Her husband's illness." maxLength={600} />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button type="submit" disabled={!ready || busy} className="light-button rounded-full px-7 py-3.5 text-lg font-semibold disabled:opacity-40">
          {busy ? "Building…" : `Build ${v.name.trim() || "their"}${v.name.trim() ? "'s" : ""} world`}
        </button>
        <p className="text-sm text-smoke">Takes about a minute. Everything you type stays in this browser.</p>
      </div>
    </form>
  );
}
