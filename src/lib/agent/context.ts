import "server-only";
import { Qloo, type Params } from "../qloo";
import type { AgentEvent, Domain, Entity, Intake, ToolPreview } from "../types";

export interface RunContext {
  qloo: Qloo;
  intake: Intake;
  era: { from: number; to: number };
  registry: Map<string, Entity>;
  seeds: Set<string>;
  exclude: string[];
  tasteTags: { name: string; weight: number }[];
  picks: Partial<Record<Domain, string[]>>;
  summary: string;
  finished: boolean;
  llmSteps: number;
  toolSeq: number;
  emit: (e: AgentEvent) => void;
}

export function eraFor(birthYear: number) {
  const now = new Date().getFullYear();
  return { from: Math.min(birthYear + 10, now), to: Math.min(birthYear + 30, now) };
}

export function createContext(intake: Intake, emit: (e: AgentEvent) => void): RunContext {
  return {
    qloo: new Qloo(),
    intake,
    era: eraFor(intake.birthYear),
    registry: new Map(),
    seeds: new Set(),
    exclude: [],
    tasteTags: [],
    picks: {},
    summary: "",
    finished: false,
    llmSteps: 0,
    toolSeq: 0,
    emit,
  };
}

/** Qloo's audience age bucket for someone born in `birthYear`. */
export function ageBucket(birthYear: number) {
  const age = new Date().getFullYear() - birthYear;
  if (age >= 55) return "55_and_older";
  if (age >= 36) return "36_to_55";
  return "35_and_younger";
}

/**
 * Era, age and location filters for each domain, applied server-side so the
 * model only has to think about taste, never about parameter syntax.
 */
export function domainParams(domain: Domain, ctx: RunContext): Params {
  const { era, intake } = ctx;
  const common: Params = { "signal.demographics.age": ageBucket(intake.birthYear) };
  switch (domain) {
    case "film":
    case "tv":
      return { ...common, "filter.release_year.min": era.from - 6, "filter.release_year.max": era.to + 2 };
    case "books":
      return { ...common, "filter.publication_year.min": era.from - 80, "filter.publication_year.max": era.to + 2 };
    case "stars":
      return {
        ...common,
        "filter.date_of_birth.min": `${intake.birthYear - 40}-01-01`,
        "filter.date_of_birth.max": `${intake.birthYear + 8}-12-31`,
      };
    case "places":
      return { ...common, "filter.location.query": intake.currentCity || intake.hometown };
    default:
      return common;
  }
}

export function register(ctx: RunContext, entities: Entity[]) {
  for (const e of entities) {
    const prev = ctx.registry.get(e.id);
    // Keep the richest copy: insights results carry affinity, search results may not.
    ctx.registry.set(e.id, prev ? { ...prev, ...e, affinity: e.affinity ?? prev.affinity, image: e.image ?? prev.image } : e);
  }
}

const round = (n: number | null) => (n === null ? null : Math.round(n * 100) / 100);

/** The compact view of an entity the model sees: enough to judge, cheap in tokens. */
export function brief(e: Entity) {
  return {
    id: e.id,
    name: e.name,
    year: e.year,
    affinity: round(e.affinity),
    popularity: round(e.popularity),
    tags: e.tags.slice(0, 3),
  };
}

export function previewOf(entities: Entity[], n = 6): ToolPreview[] {
  return entities.slice(0, n).map((e) => ({ id: e.id, name: e.name, image: e.image, domain: e.domain, year: e.year }));
}

/** Runs a tool body, streaming start/end events so the UI can show the agent at work. */
export async function traced<T>(
  ctx: RunContext,
  name: string,
  intent: string,
  body: () => Promise<{ result: T; summary: string; preview?: ToolPreview[] }>,
): Promise<T | { error: string }> {
  const id = `t${++ctx.toolSeq}`;
  const started = Date.now();
  ctx.emit({ type: "tool-start", id, name, intent });
  try {
    const { result, summary, preview } = await body();
    ctx.emit({ type: "tool-end", id, name, summary, ms: Date.now() - started, preview: preview ?? [] });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    ctx.emit({ type: "tool-error", id, name, summary: message.slice(0, 160) });
    return { error: message.slice(0, 300) };
  }
}
