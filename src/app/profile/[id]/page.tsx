"use client";

import { use } from "react";
import { AudioProvider } from "@/components/ui/Audio";
import { Nav } from "@/components/ui/Nav";
import { ProfileGate } from "@/components/studio/ProfileGate";
import { Studio } from "@/components/studio/Studio";

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AudioProvider>
      <Nav />
      <ProfileGate id={id}>{(profile) => <Studio profile={profile} />}</ProfileGate>
    </AudioProvider>
  );
}
