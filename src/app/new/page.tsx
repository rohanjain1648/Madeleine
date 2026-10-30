"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { AgentTheater } from "@/components/agent/AgentTheater";
import { EMPTY_INTAKE, IntakeForm } from "@/components/intake/IntakeForm";
import { Nav } from "@/components/ui/Nav";
import { DEMO_PEOPLE } from "@/lib/demo";
import { saveProfile } from "@/lib/store";
import { streamAgent } from "@/lib/stream-client";
import type { AgentEvent, Intake } from "@/lib/types";

function NewProfile() {
  const router = useRouter();
  const params = useSearchParams();
  const demo = DEMO_PEOPLE.find((d) => d.key === params.get("demo"));
  const [initial] = useState<Intake>(demo?.intake ?? EMPTY_INTAKE);
  const [intake, setIntake] = useState<Intake | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const autostarted = useRef(false);

  const build = useCallback(
    async (data: Intake) => {
      setIntake(data);
      setEvents([]);
      setError(null);
      setStartedAt(Date.now());
      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        let done = false;
        await streamAgent("/api/build", data, (e) => {
          setEvents((prev) => [...prev, e]);
          if (e.type === "error") setError(e.message);
          if (e.type === "profile") {
            done = true;
            saveProfile(e.profile);
            setTimeout(() => router.push(`/profile/${e.profile.id}`), 900);
          }
        });
        if (!done) setError((prev) => prev ?? "The agents stopped before finishing. Please try again.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    },
    [router],
  );

  useEffect(() => {
    if (demo && params.get("go") === "1" && !autostarted.current) {
      autostarted.current = true;
      void build(demo.intake);
    }
  }, [demo, params, build]);

  return (
    <AnimatePresence mode="wait">
      {intake ? (
        <motion.div key="theater" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-6">
          <AgentTheater
            title={`Rebuilding ${intake.name}'s world`}
            events={events}
            startedAt={startedAt}
            error={error}
            onRetry={() => void build(intake)}
          />
        </motion.div>
      ) : (
        <motion.main
          key="form"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="mx-auto grid w-full max-w-[1240px] gap-12 px-5 pb-24 pt-8 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]"
        >
          <div className="lg:sticky lg:top-10 lg:self-start">
            <h1 className="display text-[clamp(2.6rem,6vw,4.6rem)]">
              Tell us a little{" "}
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber via-stars to-amber-glow">
                about them.
              </span>
            </h1>
            <p className="mt-6 max-w-[34ch] text-lg leading-relaxed text-paper-dim">
              A handful of names is enough. Madeleine&apos;s agents use Qloo&apos;s taste graph to find everything else they would
              have loved between ten and thirty: the <span className="text-music font-medium">records</span>, the{" "}
              <span className="text-film font-medium">pictures</span>, the{" "}
              <span className="text-stars font-medium">faces</span>, and the{" "}
              <span className="text-places font-medium">everyday things</span>.
            </p>
            <p className="mt-6 max-w-[34ch] text-paper-dim">
              Don&apos;t worry about getting it right. Write it the way you&apos;d say it to a{" "}
              <span className="font-editorial-italic text-amber-glow font-medium text-[1.1rem]">friend</span>.
            </p>
          </div>
          <div className="glass rounded-3xl p-6 sm:p-8">
            <IntakeForm initial={initial} onSubmit={(d) => void build(d)} busy={false} />
          </div>
        </motion.main>
      )}
    </AnimatePresence>
  );
}

export default function NewPage() {
  return (
    <>
      <Nav quiet />
      <Suspense>
        <NewProfile />
      </Suspense>
    </>
  );
}
