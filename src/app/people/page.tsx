"use client";

import Link from "next/link";
import { Nav } from "@/components/ui/Nav";
import { Photo } from "@/components/ui/Photo";
import { useHydrated, useProfiles } from "@/lib/store";

export default function PeoplePage() {
  const hydrated = useHydrated();
  const profiles = Object.values(useProfiles()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-[1240px] px-5 pb-28 pt-6 sm:px-8">
        <h1 className="display text-[clamp(2.6rem,6vw,4.6rem)]">Your people</h1>
        <p className="mt-4 max-w-[56ch] text-lg text-paper-dim">
          Everyone you have built a world for on this device. Care teams can keep a profile for each resident here.
        </p>
        {!hydrated ? null : profiles.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-umber-600 p-10 text-center">
            <p className="text-lg text-paper-dim">No one yet. Start with someone you love, or try a demo person.</p>
            <Link href="/new" className="light-button mt-6 inline-block rounded-full px-6 py-3 font-semibold">
              Start a profile
            </Link>
          </div>
        ) : (
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => {
              const cover = p.world.map((w) => p.entities[w.entityId]).find((e) => e?.image);
              const done = p.sessions.filter((s) => s.completedAt).length;
              return (
                <li key={p.id}>
                  <Link href={`/profile/${p.id}`} className="group block overflow-hidden rounded-2xl border border-umber-700 bg-umber-850 transition-colors hover:border-amber/60">
                    <Photo src={cover?.image} alt={p.intake.name} domain={cover?.domain ?? "stars"} className="aspect-[16/9]" imgClassName="opacity-80 transition-opacity group-hover:opacity-100" />
                    <div className="p-5">
                      <p className="display text-4xl">{p.intake.name}</p>
                      <p className="mt-1 text-smoke">
                        Born {p.intake.birthYear}, {p.intake.hometown.split(",")[0]}
                      </p>
                      <p className="mt-3 text-paper-dim">
                        {done} of {p.sessions.length} session{p.sessions.length === 1 ? "" : "s"} done
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
