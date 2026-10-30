"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, use } from "react";
import { Player } from "@/components/session/Player";
import { ProfileGate } from "@/components/studio/ProfileGate";
import { AudioProvider } from "@/components/ui/Audio";

function SessionInner({ id }: { id: string }) {
  const search = useSearchParams();
  const sid = search.get("s");
  return (
    <ProfileGate id={id}>
      {(profile) => {
        const session = profile.sessions.find((s) => s.id === sid) ?? profile.sessions[profile.sessions.length - 1];
        return <Player key={session.id} profile={profile} session={session} />;
      }}
    </ProfileGate>
  );
}

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AudioProvider>
      <Suspense>
        <SessionInner id={id} />
      </Suspense>
    </AudioProvider>
  );
}
