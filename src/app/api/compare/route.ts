import { genericPlan, tasteCheck } from "@/lib/agent/generic";
import { friendlyError, IntakeSchema, rateLimited } from "@/lib/server";

export const maxDuration = 120;

export async function POST(req: Request) {
  if (rateLimited(req, 10)) {
    return Response.json({ error: "Too many comparisons from this connection. Try again in a few minutes." }, { status: 429 });
  }
  const body = (await req.json().catch(() => null)) as {
    intake?: unknown;
    seeds?: string[];
    grounded?: { music?: string[]; film?: string[]; stars?: string[] };
  } | null;
  const intake = IntakeSchema.safeParse(body?.intake);
  if (!intake.success || !Array.isArray(body?.seeds) || body.seeds.length === 0) {
    return Response.json({ error: "Build a profile first, then compare." }, { status: 400 });
  }
  try {
    const plan = await genericPlan(intake.data);
    const seeds = body.seeds;
    const [music, film, stars] = await Promise.all([
      tasteCheck(intake.data, seeds, "music", [...new Set(plan.songs.map((s) => s.artist))], body.grounded?.music ?? []),
      tasteCheck(intake.data, seeds, "film", plan.films, body.grounded?.film ?? []),
      tasteCheck(intake.data, seeds, "stars", plan.stars, body.grounded?.stars ?? []),
    ]);
    return Response.json({ plan, scores: { music, film, stars } });
  } catch (err) {
    return Response.json({ error: friendlyError(err) }, { status: 500 });
  }
}
