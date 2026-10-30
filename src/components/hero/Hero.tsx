"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "motion/react";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

export function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden">
      <div className="absolute inset-0 -z-10 animate-flicker" aria-hidden>
        <HeroScene />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_20%_15%,rgb(255_207_122/0.14),transparent_70%),linear-gradient(90deg,rgb(27_19_16/0.82),rgb(27_19_16/0.4)_42%,transparent_68%),linear-gradient(180deg,transparent_55%,var(--color-umber-900)_96%)]"
      />
      <div className="pointer-events-none mx-auto flex min-h-[calc(100svh-88px)] w-full max-w-[1240px] flex-col justify-end px-5 pb-16 sm:px-8 sm:pb-20">
        <motion.h1
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="display max-w-[13ch] text-[clamp(3.2rem,9vw,7.5rem)] text-paper [text-shadow:0_4px_40px_rgb(0_0_0/0.5)]"
        >
          When memories fade, the songs stay.
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
          className="pointer-events-auto mt-8 max-w-[56ch]"
        >
          <p className="text-[1.2rem] leading-relaxed text-paper-dim">
            Madeleine is an AI agent that rebuilds the world someone with dementia grew up in: the records, the pictures, the
            faces and the everyday things, matched to their own taste with Qloo. Then it turns that world into gentle
            sessions that learn from every smile.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/new" className="light-button rounded-full px-7 py-3.5 text-lg font-semibold">
              Start a profile
            </Link>
            <Link
              href="/new?demo=rose&go=1"
              className="rounded-full border border-paper/25 bg-umber-950/40 px-6 py-3.5 text-lg text-paper backdrop-blur transition-colors hover:border-amber hover:text-amber-glow"
            >
              Watch it build Rose&apos;s world
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
