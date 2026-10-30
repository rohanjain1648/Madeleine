import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import { groq, MODELS } from "../llm";
import { Qloo } from "../qloo";
import type { Domain, Entity, Intake } from "../types";
import { ageBucket } from "./context";

const GenericSchema = z.object({
  songs: z.array(z.object({ artist: z.string(), title: z.string() })),
  films: z.array(z.string()),
  stars: z.array(z.string()),
  tv: z.array(z.string()),
  brands: z.array(z.string()),
});
export type GenericPlan = z.infer<typeof GenericSchema>;

/** The control group: the same facts, the same model, no Qloo. */
export async function genericPlan(intake: Intake): Promise<GenericPlan> {
  const { output } = await generateText({
    model: groq(MODELS.designer),
    system: "You are a helpful assistant.",
    prompt: `Suggest items for a reminiscence session for ${intake.name}, born ${intake.birthYear}, who grew up in ${intake.hometown}. The family says they loved: ${intake.loves}. List 6 songs (artist and title), 5 films, 5 film or TV stars, 3 TV shows and 4 brands.`,
    output: Output.object({ schema: GenericSchema }),
    maxRetries: 2,
    providerOptions: { groq: { reasoningEffort: "low", structuredOutputs: true } },
  });
  if (!output) throw new Error("The generic model returned nothing");
  return output;
}

export interface ScoredItem {
  name: string;
  affinity: number | null;
  image: string | null;
  year: number | null;
  found: boolean;
}

/**
 * Scores both lists against the same taste signals in one Qloo call per domain,
 * so generic and grounded picks are measured on the same scale.
 */
export async function tasteCheck(
  intake: Intake,
  seeds: string[],
  domain: Domain,
  genericNames: string[],
  groundedIds: string[],
): Promise<{ generic: ScoredItem[]; grounded: ScoredItem[] }> {
  const qloo = new Qloo();
  const genericEntities = await Promise.all(
    genericNames.map(async (name) => ({ name, match: (await qloo.search(name, domain, 1).catch(() => []))[0] as Entity | undefined })),
  );
  const ids = [...new Set([...genericEntities.map((g) => g.match?.id).filter(Boolean), ...groundedIds])] as string[];
  const scored = ids.length
    ? await qloo
        .insights(domain, {
          "signal.interests.entities": seeds.slice(0, 8),
          "signal.demographics.age": ageBucket(intake.birthYear),
          "filter.results.entities": ids,
          take: ids.length,
        })
        .catch(() => [] as Entity[])
    : [];
  const byId = new Map(scored.map((e) => [e.id, e]));
  const toItem = (name: string, e: Entity | undefined): ScoredItem => ({
    name: e?.name ?? name,
    affinity: e ? (byId.get(e.id)?.affinity ?? null) : null,
    image: e?.image ?? byId.get(e?.id ?? "")?.image ?? null,
    year: e?.year ?? null,
    found: !!e,
  });
  return {
    generic: genericEntities.map((g) => toItem(g.name, g.match)),
    grounded: groundedIds.map((id) => toItem(byId.get(id)?.name ?? id, byId.get(id))),
  };
}
