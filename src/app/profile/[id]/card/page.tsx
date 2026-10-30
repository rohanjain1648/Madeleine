"use client";

import Link from "next/link";
import { use } from "react";
import { ProfileGate } from "@/components/studio/ProfileGate";
import { ShellMark } from "@/components/ui/Wordmark";
import type { Profile } from "@/lib/types";

function CareCard({ profile }: { profile: Profile }) {
  const { intake } = profile;
  const name = (id: string) => profile.entities[id]?.name;
  const worked = profile.sessions.flatMap((s) =>
    s.moments.filter((m) => s.reactions[m.id] === "lit" || s.reactions[m.id] === "engaged").map((m) => m.title),
  );
  const pick = (domain: string, n: number) =>
    profile.world
      .filter((w) => w.domain === domain)
      .slice(0, n)
      .map((w) => name(w.entityId))
      .filter(Boolean);
  const songs = profile.world
    .filter((w) => w.domain === "music")
    .flatMap((w) => w.tracks.map((t) => `${t.title} (${t.artist})`))
    .slice(0, 6);
  const starters = profile.sessions[0]?.moments.flatMap((m) => m.prompts).slice(0, 5) ?? [];

  return (
    <div className="min-h-screen bg-[#efe6d4] px-4 py-8 text-umber-900 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-6 flex max-w-[820px] justify-between">
        <Link href={`/profile/${profile.id}`} className="rounded-full px-4 py-2 text-umber-700 hover:text-umber-950">
          Back to {intake.name}
        </Link>
        <button type="button" onClick={() => window.print()} className="rounded-full bg-umber-900 px-5 py-2 font-semibold text-paper">
          Print this card
        </button>
      </div>
      <article className="mx-auto max-w-[820px] rounded-sm bg-[#fbf6ea] p-10 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.5)] print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-2 border-umber-900 pb-5">
          <div>
            <p className="text-sm text-umber-600">My cultural world</p>
            <h1 className="display text-6xl text-umber-950">{intake.name}</h1>
            <p className="mt-2 text-umber-700">
              Born {intake.birthYear}. Grew up in {intake.hometown}.
              {intake.language && intake.language !== "English" ? ` Prefers ${intake.language}.` : ""}
            </p>
          </div>
          <ShellMark className="size-12 text-umber-900" />
        </header>

        <p className="display-soft mt-6 text-xl leading-snug text-umber-900">{profile.portrait}</p>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <section>
            <h2 className="font-bold text-umber-950">Songs that may comfort me</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-umber-800">
              {(songs.length ? songs : pick("music", 6)).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-bold text-umber-950">Films, shows and faces I love</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-umber-800">
              {[...pick("film", 3), ...pick("tv", 2), ...pick("stars", 3)].map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-bold text-umber-950">Ways to start a conversation</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-umber-800">
              {starters.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-bold text-umber-950">Comforts</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-umber-800">
              {profile.sensoryKit.slice(0, 5).map((k) => (
                <li key={k.item}>{k.item}</li>
              ))}
            </ul>
          </section>
        </div>

        {worked.length > 0 && (
          <section className="mt-8 rounded-sm bg-[#f3e7cf] p-5">
            <h2 className="font-bold text-umber-950">What has worked in our sessions</h2>
            <p className="mt-1 text-umber-800">{[...new Set(worked)].slice(0, 8).join("; ")}</p>
          </section>
        )}

        <section className="mt-8 border-t-2 border-umber-900 pt-5">
          <h2 className="font-bold text-umber-950">Please avoid</h2>
          <p className="mt-1 text-umber-800">{profile.avoid.length ? profile.avoid.join("; ") : "Nothing noted."}</p>
        </section>

        <footer className="mt-10 text-xs text-umber-600">
          Made with Madeleine. Cultural picks from Qloo&apos;s taste graph. Not medical advice.
        </footer>
      </article>
    </div>
  );
}

export default function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProfileGate id={id}>{(profile) => <CareCard profile={profile} />}</ProfileGate>;
}
