"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MemoryCard } from "../cards/MemoryCard";
import { Carousel3D } from "./Carousel3D";
import { LifeTimeline } from "./LifeTimeline";
import { Sessions } from "./Sessions";
import { TasteGrooves } from "./TasteGrooves";
import { DOMAIN_INTRO } from "@/lib/domains";
import { deleteProfile } from "@/lib/store";
import { DOMAINS, DOMAIN_LABELS, type Profile } from "@/lib/types";

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-8">
      <h2 className="display text-[clamp(2rem,4.2vw,3.2rem)]">{children}</h2>
      {sub && <p className="mt-3 max-w-[60ch] text-lg text-paper-dim">{sub}</p>}
    </div>
  );
}

export function Studio({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { intake } = profile;
  const next = profile.sessions.find((s) => !s.completedAt) ?? profile.sessions[profile.sessions.length - 1];
  const carousel = profile.world
    .map((w) => profile.entities[w.entityId])
    .filter((e) => e && (e.image || e.domain === "music"))
    .sort((a, b) => Number(!!b.image) - Number(!!a.image))
    .map((e) => ({ id: e.id, name: e.name, image: e.image ?? profile.world.find((w) => w.entityId === e.id)?.tracks[0]?.artwork ?? null, domain: e.domain }));

  return (
    <main className="pb-28">
      <section className="mx-auto grid w-full max-w-[1240px] gap-10 px-5 pt-6 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-lg text-smoke">
            Born {intake.birthYear} in {intake.hometown}
          </p>
          <h1 className="display mt-2 text-[clamp(4rem,12vw,9rem)] leading-[0.9]">{intake.name}</h1>
          <p className="display-soft mt-6 max-w-[44ch] text-[1.45rem] leading-snug text-paper">{profile.portrait}</p>
          <p className="mt-4 max-w-[56ch] leading-relaxed text-paper-dim">{profile.tasteSummary}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-3xl p-6"
        >
          <p className="text-sm text-smoke">Next up</p>
          <p className="display-soft mt-1 text-[1.7rem] leading-tight">{next.title}</p>
          <p className="mt-2 text-paper-dim">{next.theme}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/profile/${profile.id}/session?s=${next.id}`} className="light-button rounded-full px-6 py-3 font-semibold">
              {next.completedAt ? "Play it again" : `Start session ${next.number}`}
            </Link>
            <Link href={`/profile/${profile.id}/card`} className="rounded-full border border-umber-600 px-5 py-3 text-paper-dim transition-colors hover:border-amber hover:text-paper">
              Print care card
            </Link>
            <Link href={`/profile/${profile.id}/compare`} className="rounded-full border border-umber-600 px-5 py-3 text-paper-dim transition-colors hover:border-amber hover:text-paper">
              Compare with plain AI
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="mt-10" aria-label="Their world on a carousel">
        <Carousel3D items={carousel} />
      </section>

      <section className="mx-auto mt-16 w-full max-w-[1240px] px-5 sm:px-8">
        <SectionTitle sub="Qloo's taste analysis of the things the family named: the threads that run through everything they love.">
          The shape of their taste
        </SectionTitle>
        <TasteGrooves tags={profile.tasteTags} name={intake.name} />
      </section>

      <section className="mx-auto mt-24 w-full max-w-[1240px] px-5 sm:px-8">
        <SectionTitle sub={`Everything here came from Qloo's taste graph, starting from what the family remembered. Hearts mark the favourites you named.`}>
          {intake.name}&apos;s world
        </SectionTitle>
        <div className="space-y-20">
          {DOMAINS.map((d) => {
            const items = profile.world.filter((w) => w.domain === d && profile.entities[w.entityId]);
            if (items.length === 0) return null;
            return (
              <div key={d}>
                <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-umber-800 pb-3">
                  <h3 className="display-soft text-[1.9rem]" style={{ color: `var(--color-${d})` }}>
                    {DOMAIN_LABELS[d]}
                  </h3>
                  <p className="text-paper-dim">{DOMAIN_INTRO[d]}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map((w, i) => (
                    <MemoryCard key={w.entityId} entity={profile.entities[w.entityId]} item={w} index={i} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-24 w-full max-w-[1240px] px-5 sm:px-8">
        <SectionTitle sub="The songs, films, shows and books, placed in the year they arrived. Hover a dot to see what it was.">
          Their years
        </SectionTitle>
        <LifeTimeline profile={profile} />
      </section>

      <section id="sessions" className="mx-auto mt-24 w-full max-w-[1240px] scroll-mt-8 px-5 sm:px-8">
        <SectionTitle sub="Each session is about twenty minutes. Afterwards, tell Madeleine how it went and it plans the next one.">
          Sessions
        </SectionTitle>
        <Sessions profile={profile} />
      </section>

      <section className="mx-auto mt-24 grid w-full max-w-[1240px] gap-6 px-5 sm:px-8 lg:grid-cols-2">
        <div className="rounded-2xl bg-umber-850 p-7">
          <h2 className="display-soft text-[1.8rem]">A comfort kit</h2>
          <p className="mt-2 text-paper-dim">Tastes, scents and textures to bring along. Smell and taste reach memory by their own road.</p>
          <ul className="mt-5 space-y-4">
            {profile.sensoryKit.map((k) => (
              <li key={k.item}>
                <p className="font-semibold text-paper">{k.item}</p>
                <p className="text-[0.95rem] text-paper-dim">{k.why}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-umber-850 p-7">
          <h2 className="display-soft text-[1.8rem]">Gently does it</h2>
          <p className="mt-2 text-paper-dim">Madeleine keeps these out of every session.</p>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-paper">
            {(profile.avoid.length ? profile.avoid : ["Nothing noted yet. Add topics in a new profile if needed."]).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <div className="mt-8 border-t border-umber-700 pt-5 text-sm text-smoke">
            <p>
              Built by Madeleine&apos;s agents with {profile.stats.qlooCalls} Qloo calls and {profile.stats.llmSteps} model steps in{" "}
              {(profile.stats.ms / 1000).toFixed(0)} seconds.
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete ${intake.name}'s profile from this browser?`)) {
                  deleteProfile(profile.id);
                  router.push("/people");
                }
              }}
              className="mt-3 text-film underline-offset-4 hover:underline"
            >
              Delete this profile
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
