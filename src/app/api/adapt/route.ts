import { adaptProfile } from "@/lib/agent/pipeline";
import { ndjson, rateLimited } from "@/lib/server";
import type { Profile } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: Request) {
  if (rateLimited(req, 12)) {
    return Response.json({ error: "Too many requests from this connection. Try again in a few minutes." }, { status: 429 });
  }
  const body = (await req.json().catch(() => null)) as { profile?: Profile; sessionId?: string } | null;
  const profile = body?.profile;
  if (!profile?.intake || !Array.isArray(profile.sessions) || profile.sessions.length === 0) {
    return Response.json({ error: "Send the profile and the session to learn from." }, { status: 400 });
  }
  return ndjson(async (emit) => {
    const result = await adaptProfile(profile, body?.sessionId ?? "", emit);
    emit({ type: "session", ...result });
  });
}
