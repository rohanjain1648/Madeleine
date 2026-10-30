import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { DOMAINS, type Domain, type Entity } from "../types";
import { brief, domainParams, previewOf, register, traced, ageBucket, type RunContext } from "./context";

// Schemas stay permissive on purpose: Groq rejects a whole tool call when arguments break a
// constraint, so we accept loose input and normalise it here instead.
const domain = z.string().describe(`One of: ${DOMAINS.join(", ")}`);
const intent = z
  .string()
  .optional()
  .describe("One short, plain sentence explaining why you are making this call. The family sees it live.");
const ids = z.array(z.string());

const SYNONYMS: Record<string, Domain> = {
  artist: "music", artists: "music", musician: "music", singer: "music", song: "music", songs: "music",
  movie: "film", movies: "film", films: "film", cinema: "film",
  tv_show: "tv", television: "tv", show: "tv", shows: "tv",
  person: "stars", people: "stars", star: "stars", actor: "stars", actress: "stars", celebrity: "stars",
  book: "books", author: "books", brand: "brands", product: "brands", food: "brands",
  destination: "destinations", city: "destinations", travel: "destinations",
  place: "places", venue: "places", restaurant: "places", outing: "places",
};

export function toDomain(raw: string | undefined): Domain {
  const k = (raw ?? "").toLowerCase().replace(/^urn:entity:/, "").trim();
  if ((DOMAINS as string[]).includes(k)) return k as Domain;
  return SYNONYMS[k] ?? "music";
}

export function curatorTools(ctx: RunContext) {
  return {
    search_qloo: tool({
      description:
        "Resolve names (people, songs' artists, films, shows, brands, places) to Qloo entities. Batch every lookup you need into one call.",
      inputSchema: z.object({
        intent,
        queries: z.array(z.object({ text: z.string(), domain })),
      }),
      execute: async ({ intent, queries }) =>
        traced(ctx, "search_qloo", intent ?? "Finding the family's favourites in Qloo", async () => {
          const results = await Promise.all(
            queries.slice(0, 12).map(async (raw) => {
              const q = { text: raw.text.slice(0, 80), domain: toDomain(raw.domain) };
              const matches = await ctx.qloo.search(q.text, q.domain, 3).catch(() => [] as Entity[]);
              register(ctx, matches);
              return { query: q.text, domain: q.domain, matches };
            }),
          );
          const found = results.filter((r) => r.matches.length > 0);
          return {
            result: results.map((r) => ({ query: r.query, domain: r.domain, matches: r.matches.map(brief) })),
            summary: `Resolved ${found.length} of ${queries.length} names in Qloo's graph`,
            preview: previewOf(found.map((r) => r.matches[0])),
          };
        }),
    }),

    taste_fingerprint: tool({
      description:
        "Read the characteristic taste tags behind a set of seed entities (Qloo taste analysis). Call once, after resolving seeds.",
      inputSchema: z.object({ intent, seedIds: ids }),
      execute: async ({ intent, seedIds }) =>
        traced(ctx, "taste_fingerprint", intent ?? "Reading what ties their favourites together", async () => {
          // Read taste from cultural seeds only; places and foods drag in tags like price or region.
          const cultural = seedIds.filter((id) => ["music", "film", "tv", "stars", "books"].includes(ctx.registry.get(id)?.domain ?? ""));
          const tags = await ctx.qloo.tasteTags((cultural.length ? cultural : seedIds).slice(0, 10), 30);
          const named = tags.filter((t) => t.name);
          const max = Math.max(...named.map((t) => t.weight), 0.0001);
          ctx.tasteTags = named.map((t) => ({ name: t.name, weight: Math.round((t.weight / max) * 100) / 100 }));
          seedIds.forEach((id) => ctx.seeds.add(id));
          return {
            result: named.slice(0, 15).map((t) => t.name),
            summary: named.length
              ? `Taste fingerprint: ${named
                  .slice(0, 4)
                  .map((t) => t.name)
                  .join(", ")}`
              : "No taste tags came back for these seeds",
          };
        }),
    }),

    discover: tool({
      description:
        "Ask Qloo's taste graph what someone with these tastes loves in one domain. Era, age and location filters are applied for you. Call it for several domains in parallel in the same step.",
      inputSchema: z.object({
        intent,
        domain,
        seedIds: ids.describe("Qloo entity ids used as taste signals"),
        tagIds: ids.optional().describe("Optional Qloo tag ids from find_tags to steer results"),
        take: z.number().optional(),
      }),
      execute: async ({ intent, domain: rawDomain, seedIds: rawSeeds, tagIds, take }) =>
        traced(ctx, "discover", intent ?? `Exploring ${toDomain(rawDomain)}`, async () => {
          const domain = toDomain(rawDomain);
          const seedIds = (rawSeeds.length ? rawSeeds : [...ctx.seeds]).slice(0, 8);
          seedIds.forEach((id) => ctx.seeds.add(id));
          const entities = (
            await ctx.qloo.insights(domain, {
              ...domainParams(domain, ctx),
              "signal.interests.entities": seedIds,
              "signal.interests.tags": tagIds?.slice(0, 4),
              "filter.exclude.entities": ctx.exclude,
              take: Math.min(20, Math.max(4, Math.round(take ?? 12))),
            })
          ).filter((e) => !seedIds.includes(e.id));
          register(ctx, entities);
          return {
            result: entities.map(brief),
            summary: entities.length
              ? `${entities.length} ${domain} picks, led by ${entities[0].name}`
              : `Nothing came back for ${domain}`,
            preview: previewOf(entities),
          };
        }),
    }),

    rank_by_taste: tool({
      description:
        "Rank era-appropriate names you know from history by how strongly this person's taste predicts they'd love them (Qloo affinity). Use it when discover skews modern or thin.",
      inputSchema: z.object({
        intent,
        domain,
        names: z.array(z.string()),
        seedIds: ids,
      }),
      execute: async ({ intent, domain: rawDomain, names: rawNames, seedIds: rawSeeds }) =>
        traced(ctx, "rank_by_taste", intent ?? "Ranking era favourites by their taste", async () => {
          const domain = toDomain(rawDomain);
          const names = rawNames.slice(0, 12);
          const seedIds = (rawSeeds.length ? rawSeeds : [...ctx.seeds]).slice(0, 8);
          const found = (
            await Promise.all(names.map((n) => ctx.qloo.search(n, domain, 1).catch(() => [] as Entity[])))
          ).flat();
          register(ctx, found);
          const ids = [...new Set(found.map((e) => e.id))];
          if (ids.length === 0) return { result: [], summary: "None of those names are in Qloo's graph" };
          const ranked = await ctx.qloo
            .insights(domain, {
              "signal.interests.entities": seedIds,
              "signal.demographics.age": ageBucket(ctx.intake.birthYear),
              "filter.results.entities": ids,
              take: ids.length,
            })
            .catch(() => [] as Entity[]);
          register(ctx, ranked);
          const ordered = ranked.length ? ranked : found;
          return {
            result: ordered.map(brief),
            summary: `Ranked ${ordered.length} candidates by taste affinity`,
            preview: previewOf(ordered),
          };
        }),
    }),

    find_tags: tool({
      description: "Find Qloo tag ids for a genre, style or theme, such as 'big band', 'doo-wop', 'film noir' or 'bollywood'.",
      inputSchema: z.object({ intent, query: z.string() }),
      execute: async ({ intent, query }) =>
        traced(ctx, "find_tags", intent ?? `Looking up ${query}`, async () => {
          const tags = await ctx.qloo.findTags(query, 6);
          return {
            result: tags,
            summary: tags.length ? `Found tags: ${tags.map((t) => t.name).join(", ")}` : `No tags for "${query}"`,
          };
        }),
    }),

    finish: tool({
      description: "Submit your final selections. Call exactly once, at the very end.",
      inputSchema: z.object({
        summary: z.string().optional().describe("Two sentences on what you learned about their taste."),
        picks: z.array(z.object({ domain, ids: z.array(z.string()) })),
      }),
      execute: async ({ summary, picks }) => {
        let kept = 0;
        for (const p of picks) {
          const d = toDomain(p.domain);
          const valid = p.ids.filter((id) => ctx.registry.has(id));
          kept += valid.length;
          ctx.picks[d] = [...new Set([...(ctx.picks[d] ?? []), ...valid])];
        }
        ctx.summary = summary ?? "";
        ctx.finished = true;
        if (summary) ctx.emit({ type: "thought", text: summary });
        return { ok: true, kept };
      },
    }),
  };
}
