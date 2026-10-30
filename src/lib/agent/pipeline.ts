import "server-only";
import { generateText, hasToolCall, Output, stepCountIs } from "ai";
import { z } from "zod";
import { findTrack } from "../itunes";
import { groq, MODELS } from "../llm";
import {
  DOMAINS,
  type AgentEvent,
  type Domain,
  type Entity,
  type Intake,
  type Moment,
  type MomentKind,
  type Profile,
  type Session,
  type Track,
  type WorldItem,
} from "../types";
import { createContext, type RunContext } from "./context";
import { CURATOR_SYSTEM, DESIGNER_SYSTEM, REFLECT_SYSTEM, describePerson } from "./prompts";
import { curatorTools } from "./tools";

const PICK_TARGETS: Record<Domain, number> = {
  music: 7,
  film: 6,
  tv: 4,
  stars: 6,
  books: 3,
  brands: 5,
  destinations: 3,
  places: 4,
};

const MOMENT_KINDS = ["song", "film", "tv", "star", "book", "brand", "place", "story", "sensory"] as const;

const MomentSchema = z.object({
  kind: z.enum(MOMENT_KINDS),
  entityId: z.string().describe("Candidate id this moment is about, or an empty string for story/sensory moments"),
  title: z.string(),
  song: z.string().describe("For song moments: one specific recording title. Otherwise an empty string."),
  prompts: z.array(z.string()).describe("2-3 gentle conversation invitations"),
  caregiverTip: z.string(),
  sensory: z.string().describe("A taste, scent or texture to bring in, or an empty string"),
  minutes: z.number(),
});

const SessionSchema = z.object({
  title: z.string().describe("A warm title, e.g. 'Saturday night at the Paramount'"),
  theme: z.string().describe("One sentence on the thread running through the session"),
  moments: z.array(MomentSchema),
});

const DesignSchema = z.object({
  portrait: z.string().describe("Two sentences painting the cultural world they grew up in"),
  tasteSummary: z.string().describe("One sentence on what their taste says about them"),
  world: z.array(
    z.object({
      entityId: z.string(),
      why: z.string().describe("Under 18 words: why this belongs in their world"),
      songs: z.array(z.string()).describe("For music artists: 2 well-known recordings from their era. Otherwise empty."),
    }),
  ),
  session: SessionSchema,
  sensoryKit: z.array(z.object({ item: z.string(), why: z.string() })),
  outings: z.array(z.object({ entityId: z.string(), why: z.string() })),
  avoid: z.array(z.string()),
});

const AdaptSchema = z.object({
  learned: z.array(z.string()).describe("3-5 short notes on what the last session taught you, in plain language"),
  world: z.array(z.object({ entityId: z.string(), why: z.string(), songs: z.array(z.string()) })),
  session: SessionSchema,
});

async function pMap<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

function errorText(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

async function runAgent(ctx: RunContext, system: string, prompt: string, maxSteps: number) {
  const tools = curatorTools(ctx);
  for (const model of [MODELS.curator, MODELS.fallback]) {
    try {
      await generateText({
        model: groq(model),
        system,
        prompt,
        tools,
        stopWhen: [stepCountIs(maxSteps), hasToolCall("finish")],
        maxRetries: 2,
        providerOptions: { groq: { reasoningEffort: "low", parallelToolCalls: true } },
        onStepEnd: (step) => {
          ctx.llmSteps++;
          const text = step.text?.trim();
          if (text) ctx.emit({ type: "thought", text: text.slice(0, 400) });
        },
      });
      return;
    } catch (err) {
      ctx.emit({ type: "thought", text: `Model ${model} stumbled (${errorText(err).slice(0, 120)}). Recovering.` });
      if (ctx.registry.size > 12) return;
    }
  }
}

/** If the agent ran out of steps before calling finish, keep the strongest results per domain. */
function fillPicks(ctx: RunContext) {
  for (const domain of DOMAINS) {
    const have = ctx.picks[domain] ?? [];
    if (have.length >= Math.min(3, PICK_TARGETS[domain])) continue;
    const ranked = [...ctx.registry.values()]
      .filter((e) => e.domain === domain && !ctx.seeds.has(e.id) && !ctx.exclude.includes(e.id))
      .sort((a, b) => (b.affinity ?? 0) - (a.affinity ?? 0) || (b.popularity ?? 0) - (a.popularity ?? 0));
    ctx.picks[domain] = [...new Set([...have, ...ranked.map((e) => e.id)])].slice(0, PICK_TARGETS[domain]);
  }
}

function candidateList(ctx: RunContext, ids: { id: string; favourite: boolean }[]) {
  const byDomain = new Map<Domain, string[]>();
  for (const { id, favourite } of ids) {
    const e = ctx.registry.get(id);
    if (!e) continue;
    const line = `- [${e.id}] ${e.name}${e.year ? ` (${e.year})` : ""}${favourite ? " (family favourite)" : ""}${
      e.tags.length ? ` - ${e.tags.slice(0, 3).join(", ")}` : ""
    }${e.address ? ` - ${e.address}` : ""}`;
    byDomain.set(e.domain, [...(byDomain.get(e.domain) ?? []), line]);
  }
  return [...byDomain.entries()].map(([d, lines]) => `${d.toUpperCase()}\n${lines.join("\n")}`).join("\n\n");
}

async function designObject<T>(schema: z.ZodType<T>, system: string, prompt: string, ctx: RunContext): Promise<T> {
  let lastErr: unknown;
  for (const [model, structured] of [
    [MODELS.designer, true],
    [MODELS.designer, false],
    [MODELS.fallback, false],
  ] as const) {
    try {
      const { output } = await generateText({
        model: groq(model),
        system,
        prompt,
        output: Output.object({ schema }),
        maxRetries: 2,
        providerOptions: { groq: { reasoningEffort: "medium", structuredOutputs: structured } },
      });
      ctx.llmSteps++;
      if (output) return output as T;
    } catch (err) {
      lastErr = err;
      ctx.emit({ type: "thought", text: `Designer retrying (${errorText(err).slice(0, 100)})` });
    }
  }
  throw lastErr ?? new Error("The designer could not compose a session");
}

const kindDomain: Partial<Record<MomentKind, Domain>> = {
  song: "music",
  film: "film",
  tv: "tv",
  star: "stars",
  book: "books",
  brand: "brands",
  place: "places",
};

async function buildMoments(ctx: RunContext, raw: z.infer<typeof SessionSchema>["moments"]): Promise<Moment[]> {
  return pMap(raw.slice(0, 9), 3, async (m, ) => {
    const entity = m.entityId ? ctx.registry.get(m.entityId) : undefined;
    const valid = entity && (!kindDomain[m.kind] || kindDomain[m.kind] === entity.domain || m.kind === "place");
    let track: Track | null = null;
    if (m.kind === "song" && m.song && (entity?.name || m.title)) {
      track = await findTrack(entity?.name ?? m.title, m.song);
    }
    return {
      id: crypto.randomUUID().slice(0, 8),
      kind: m.kind,
      entityId: valid ? entity!.id : null,
      title: m.title,
      track,
      prompts: m.prompts.filter(Boolean).slice(0, 3),
      caregiverTip: m.caregiverTip,
      sensory: m.sensory?.trim() ? m.sensory : null,
      minutes: Math.min(10, Math.max(1, Math.round(m.minutes || 3))),
    };
  });
}

async function buildWorld(
  ctx: RunContext,
  ids: { id: string; favourite: boolean }[],
  design: { entityId: string; why: string; songs: string[] }[],
  outings: { entityId: string; why: string }[] = [],
): Promise<WorldItem[]> {
  const notes = new Map(design.map((w) => [w.entityId, w]));
  const outingNotes = new Map(outings.map((o) => [o.entityId, o.why]));
  const items = ids
    .map(({ id, favourite }) => ({ e: ctx.registry.get(id), favourite }))
    .filter((x): x is { e: Entity; favourite: boolean } => !!x.e);
  return pMap(items, 3, async ({ e, favourite }) => {
    const note = notes.get(e.id);
    const tracks: Track[] = [];
    if (e.domain === "music") {
      for (const song of (note?.songs ?? []).slice(0, 2)) {
        const t = await findTrack(e.name, song);
        if (t) tracks.push(t);
      }
    }
    return {
      entityId: e.id,
      domain: e.domain,
      why:
        note?.why ??
        outingNotes.get(e.id) ??
        (favourite ? "Named by the family as a favourite" : "Close to their taste in Qloo's graph"),
      tracks,
    };
  });
}

function orderedIds(ctx: RunContext) {
  const seen = new Set<string>();
  const out: { id: string; favourite: boolean }[] = [];
  for (const domain of DOMAINS) {
    const seeds = [...ctx.seeds].filter((id) => ctx.registry.get(id)?.domain === domain);
    for (const id of [...seeds, ...(ctx.picks[domain] ?? [])]) {
      if (seen.has(id) || !ctx.registry.has(id)) continue;
      seen.add(id);
      out.push({ id, favourite: ctx.seeds.has(id) });
    }
  }
  return out;
}

export async function buildProfile(intake: Intake, emit: (e: AgentEvent) => void): Promise<Profile> {
  const started = Date.now();
  const ctx = createContext(intake, emit);

  emit({ type: "phase", phase: "curate", label: `The Curator is reading ${intake.name}'s story` });
  await runAgent(
    ctx,
    CURATOR_SYSTEM,
    `${describePerson(intake, ctx.era)}\n\nRebuild ${intake.name}'s cultural world. Start by resolving the names above.`,
    7,
  );
  fillPicks(ctx);
  if (ctx.registry.size === 0) throw new Error("Qloo returned nothing for this person. Try adding a few favourite names.");

  emit({ type: "phase", phase: "design", label: "The Designer is composing the first session" });
  const ids = orderedIds(ctx);
  const design = await designObject(
    DesignSchema,
    DESIGNER_SYSTEM,
    `${describePerson(intake, ctx.era)}\n\nTaste fingerprint from Qloo: ${ctx.tasteTags
      .slice(0, 12)
      .map((t) => t.name)
      .join(", ") || "n/a"}\nCurator's notes: ${ctx.summary || "n/a"}\n\nCandidates (id in brackets):\n${candidateList(
      ctx,
      ids,
    )}\n\nWrite: a portrait, a taste summary, a 'why' for each candidate (with 2 songs for each music artist), the first session, a sensory kit of 4-6 items, 3-4 outings chosen from PLACES candidates, and an avoid list.`,
    ctx,
  );

  emit({ type: "phase", phase: "hydrate", label: "Finding the recordings and pictures" });
  const [world, moments] = await Promise.all([
    buildWorld(ctx, ids, design.world, design.outings),
    buildMoments(ctx, design.session.moments),
  ]);

  const used = new Set([...world.map((w) => w.entityId), ...moments.map((m) => m.entityId).filter(Boolean)] as string[]);
  const entities: Record<string, Entity> = {};
  for (const id of used) {
    const e = ctx.registry.get(id);
    if (e) entities[id] = e;
  }

  const session: Session = {
    id: crypto.randomUUID().slice(0, 8),
    number: 1,
    title: design.session.title,
    theme: design.session.theme,
    createdAt: new Date().toISOString(),
    moments,
    reactions: {},
    notes: {},
    completedAt: null,
    learned: [],
  };

  emit({ type: "phase", phase: "done", label: `${intake.name}'s world is ready` });
  return {
    id: crypto.randomUUID().slice(0, 10),
    createdAt: new Date().toISOString(),
    intake,
    era: ctx.era,
    portrait: design.portrait,
    tasteSummary: design.tasteSummary,
    tasteTags: ctx.tasteTags.slice(0, 18),
    entities,
    world,
    seeds: [...ctx.seeds],
    learned: { boost: [], exclude: [] },
    sessions: [session],
    sensoryKit: design.sensoryKit.slice(0, 6),
    outings: design.outings.filter((o) => entities[o.entityId]?.domain === "places").slice(0, 4),
    avoid: design.avoid.slice(0, 8),
    stats: { qlooCalls: ctx.qloo.calls, llmSteps: ctx.llmSteps, ms: Date.now() - started, model: MODELS.curator },
  };
}

/** After a session: learn from reactions, explore around what worked, compose the next session. */
export async function adaptProfile(profile: Profile, sessionId: string, emit: (e: AgentEvent) => void) {
  const ctx = createContext(profile.intake, emit);
  ctx.era = profile.era;
  for (const e of Object.values(profile.entities)) ctx.registry.set(e.id, e);
  profile.seeds.forEach((id) => ctx.seeds.add(id));

  const session = profile.sessions.find((s) => s.id === sessionId) ?? profile.sessions[profile.sessions.length - 1];
  const byReaction = (r: string) =>
    session.moments.filter((m) => session.reactions[m.id] === r);
  const lit = byReaction("lit");
  const engaged = byReaction("engaged");
  const neutral = byReaction("neutral");
  const upset = byReaction("distressed");
  const idsOf = (ms: Moment[]) => ms.map((m) => m.entityId).filter((x): x is string => !!x);

  const boost = [...new Set([...profile.learned.boost, ...idsOf(lit)])];
  const exclude = [...new Set([...profile.learned.exclude, ...idsOf(upset)])];
  const resting = idsOf(neutral);
  ctx.exclude = [...new Set([...exclude, ...profile.world.map((w) => w.entityId)])];

  const line = (label: string, ms: Moment[]) =>
    `${label}: ${ms.length ? ms.map((m) => `${m.title}${m.entityId ? ` [${m.entityId}]` : ""}`).join("; ") : "none"}`;
  const notes = Object.entries(session.notes)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `${session.moments.find((m) => m.id === k)?.title ?? "Moment"}: ${v}`)
    .join("\n");

  emit({ type: "phase", phase: "reflect", label: `The Reflector is studying session ${session.number}` });
  await runAgent(
    ctx,
    REFLECT_SYSTEM,
    `${describePerson(profile.intake, profile.era)}\n\nSession ${session.number} ("${session.title}"):\n${line("Lit up", lit)}\n${line(
      "Engaged",
      engaged,
    )}\n${line("No response", neutral)}\n${line("Upset", upset)}\n${notes ? `Carer notes:\n${notes}\n` : ""}\nOriginal seed ids: ${profile.seeds.join(
      ", ",
    )}\nIds that lit them up (use as extra seeds): ${boost.join(", ") || "none"}\n\nFind new, adjacent things to bring into the next session.`,
    5,
  );
  for (const domain of DOMAINS) ctx.picks[domain] = (ctx.picks[domain] ?? []).filter((id) => !ctx.exclude.includes(id));

  const fresh = DOMAINS.flatMap((d) => (ctx.picks[d] ?? []).map((id) => ({ id, favourite: false })));
  const favourites = boost.filter((id) => ctx.registry.has(id)).map((id) => ({ id, favourite: true }));
  const familiar = profile.world
    .filter((w) => !exclude.includes(w.entityId) && !resting.includes(w.entityId) && !boost.includes(w.entityId))
    .slice(0, 14)
    .map((w) => ({ id: w.entityId, favourite: false }));

  emit({ type: "phase", phase: "design", label: `The Designer is composing session ${session.number + 1}` });
  const design = await designObject(
    AdaptSchema,
    DESIGNER_SYSTEM,
    `${describePerson(profile.intake, profile.era)}\n\nLast session: ${line("Lit up", lit)}. ${line("Upset", upset)}. ${line(
      "No response",
      neutral,
    )}.\n${notes ? `Carer notes:\n${notes}\n` : ""}\nProven favourites (bring back one or two, familiarity comforts):\n${candidateList(
      ctx,
      favourites,
    ) || "none yet"}\n\nNew discoveries from Qloo:\n${candidateList(ctx, fresh) || "none"}\n\nOther things from their world:\n${candidateList(
      ctx,
      familiar,
    )}\n\nWrite 3-5 'learned' notes, a 'why' for each new discovery (2 songs for music), and session ${session.number + 1}.`,
    ctx,
  );

  emit({ type: "phase", phase: "hydrate", label: "Finding the recordings and pictures" });
  const [world, moments] = await Promise.all([
    buildWorld(ctx, fresh, design.world),
    buildMoments(ctx, design.session.moments),
  ]);
  const entities: Record<string, Entity> = {};
  for (const id of [...world.map((w) => w.entityId), ...moments.map((m) => m.entityId)]) {
    const e = id ? ctx.registry.get(id) : undefined;
    if (e && !profile.entities[e.id]) entities[e.id] = e;
  }
  const next: Session = {
    id: crypto.randomUUID().slice(0, 8),
    number: session.number + 1,
    title: design.session.title,
    theme: design.session.theme,
    createdAt: new Date().toISOString(),
    moments,
    reactions: {},
    notes: {},
    completedAt: null,
    learned: design.learned.slice(0, 5),
  };
  emit({ type: "phase", phase: "done", label: `Session ${next.number} is ready` });
  return { session: next, entities, world, learned: { boost, exclude } };
}
