"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useHydrated, useProfile } from "@/lib/store";
import type { Profile } from "@/lib/types";

/** Waits for the browser store, then renders the profile or a clear way forward. */
export function ProfileGate({ id, children }: { id: string; children: (profile: Profile) => ReactNode }) {
  const hydrated = useHydrated();
  const profile = useProfile(id);
  if (!hydrated) {
    return <div className="mx-auto mt-32 size-10 animate-spin rounded-full border-2 border-umber-600 border-t-amber" aria-label="Loading" />;
  }
  if (!profile) {
    return (
      <main className="mx-auto max-w-[640px] px-5 py-32 text-center">
        <h1 className="display text-5xl">This profile isn&apos;t in this browser.</h1>
        <p className="mt-5 text-lg text-paper-dim">
          Profiles are saved only on the device that made them. Build a new one, or try one of the demo people.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/new" className="light-button rounded-full px-6 py-3 font-semibold">
            Start a profile
          </Link>
          <Link href="/" className="rounded-full border border-umber-600 px-6 py-3 text-paper-dim hover:text-paper">
            Back home
          </Link>
        </div>
      </main>
    );
  }
  return <>{children(profile)}</>;
}
