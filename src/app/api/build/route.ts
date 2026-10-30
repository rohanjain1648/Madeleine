import { buildProfile } from "@/lib/agent/pipeline";
import { IntakeSchema, ndjson, rateLimited } from "@/lib/server";

export const maxDuration = 300;

export async function POST(req: Request) {
  if (rateLimited(req)) {
    return Response.json({ error: "Too many profiles from this connection. Try again in a few minutes." }, { status: 429 });
  }
  const parsed = IntakeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Please fill in a name, birth year, hometown and a few things they loved." }, { status: 400 });
  }
  return ndjson(async (emit) => {
    const profile = await buildProfile(parsed.data, emit);
    emit({ type: "profile", profile });
  });
}
