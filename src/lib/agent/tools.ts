import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { DOMAINS, type Domain, type Entity } from "../types";
import { brief, domainParams, previewOf, register, traced, ageBucket, type RunContext } from "./context";

const domain = z.enum(DOMAINS as [Domain, ...Domain[]]);
const intent = z
  .string()
  .describe("One short, plain sentence explaining why you are making this call. The family sees it live.");

export function curatorTools(ctx: RunContext) {
  return {
    search_qloo: tool({
      description:
        "Resolve names (people, songs' artists, films, shows, brands, places) to Qloo entities. Batch every lookup you need into one call.",
      inputSchema: z.object({
        intent,
        queries: z
          .array(z.object({ text: z.string().min(1).max(80), domain }))
          .min(1)
          .max(10),
      }),
      execute: async ({ intent, queries }) =>
        traced(ctx, "search_qloo", intent, async () => {
          const results = await Promise.all(
            queries.map(async (q) => {
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
      inputSchema: z.object({ intent, seedIds: z.array(z.string()).min(1).max(10) }),
      execute: async ({ intent, seedIds }) =>
        traced(ctx, "taste_fingerprint", intent, async () => {
          const tags = await ctx.qloo.tasteTags(seedIds, 30);
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
        seedIds: z.array(z.string()).min(1).max(8).describe("Qloo entity ids used as taste signals"),
        tagIds: z.array(z.string()).max(4).optional().describe("Optional Qloo tag ids from find_tags to steer results"),
        take: z.number().int().min(4).max(20).optional(),
      }),
      execute: async ({ intent, domain, seedIds, tagIds, take }) =>
        traced(ctx, "discover", intent, async () => {
          seedIds.forEach((id) => ctx.seeds.add(id));
          const entities = (
            await ctx.qloo.insights(domain, {
              ...domainParams(domain, ctx),
              "signal.interests.entities": seedIds,
              "signal.interests.tags": tagIds,
              "filter.exclude.entities": ctx.exclude,
              take: take ?? 12,
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
        names: z.array(z.string().min(1).max(80)).min(2).max(12),
        seedIds: z.array(z.string()).min(1).max(8),
      }),
      execute: async ({ intent, domain, names, seedIds }) =>
        traced(ctx, "rank_by_taste", intent, async () => {
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
      inputSchema: z.object({ intent, query: z.string().min(2).max(60) }),
      execute: async ({ intent, query }) =>
        traced(ctx, "find_tags", intent, async () => {
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
        summary: z.string().describe("Two sentences on what you learned about their taste."),
        picks: z.array(z.object({ domain, ids: z.array(z.string()) })),
      }),
      execute: async ({ summary, picks }) => {
        let kept = 0;
        for (const p of picks) {
          const valid = p.ids.filter((id) => ctx.registry.has(id));
          kept += valid.length;
          ctx.picks[p.domain] = [...new Set([...(ctx.picks[p.domain] ?? []), ...valid])];
        }
        ctx.summary = summary;
        ctx.finished = true;
        ctx.emit({ type: "thought", text: summary });
        return { ok: true, kept };
      },
    }),
  };
}
