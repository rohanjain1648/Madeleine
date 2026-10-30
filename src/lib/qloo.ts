import "server-only";
import { DOMAIN_TYPES, type Domain, type Entity } from "./types";

const BASE = process.env.QLOO_BASE_URL ?? "https://hackathon.api.qloo.com";

type ParamValue = string | number | boolean | string[] | null | undefined;
export type Params = Record<string, ParamValue>;

export class QlooError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`Qloo ${status}: ${body.slice(0, 300)}`);
  }
}

// Private server-side cache (allowed by the hackathon terms). Never persisted to the repo.
const cache = new Map<string, { at: number; value: unknown }>();
const TTL = 1000 * 60 * 60 * 6;
const MAX = 800;

function cacheGet(key: string) {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > TTL) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function cacheSet(key: string, value: unknown) {
  if (cache.size >= MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), value });
}

/** A Qloo client scoped to one agent run, so calls can be counted per run. */
export class Qloo {
  calls = 0;
  private key: string;

  constructor(key = process.env.QLOO_API_KEY) {
    if (!key) throw new Error("QLOO_API_KEY is not set");
    this.key = key;
  }

  async get<T = unknown>(path: string, params: Params): Promise<T> {
    const url = new URL(path, BASE);
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      if (Array.isArray(v)) {
        if (v.length === 0) continue;
        url.searchParams.set(k, v.join(","));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
    const key = url.toString();
    const hit = cacheGet(key);
    if (hit !== undefined) return hit as T;

    this.calls++;
    let res: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(url, {
        headers: { "X-Api-Key": this.key, accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (res.status !== 429 && res.status < 500) break;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
    if (!res || !res.ok) throw new QlooError(res?.status ?? 0, res ? await res.text() : "no response");
    const json = (await res.json()) as T;
    cacheSet(key, json);
    return json;
  }

  async search(query: string, domain: Domain, take = 3): Promise<Entity[]> {
    const json = await this.get<{ results?: unknown[] }>("/search", {
      query,
      types: DOMAIN_TYPES[domain],
      take,
    });
    return (json.results ?? []).map((r) => toEntity(r, domain)).filter((e): e is Entity => !!e);
  }

  async insights(domain: Domain, params: Params): Promise<Entity[]> {
    const json = await this.get<{ results?: { entities?: unknown[] } }>("/v2/insights", {
      "filter.type": DOMAIN_TYPES[domain],
      ...params,
    });
    return (json.results?.entities ?? []).map((r) => toEntity(r, domain)).filter((e): e is Entity => !!e);
  }

  /** Taste analysis: the tags that characterise a set of entities. */
  async tasteTags(seedIds: string[], take = 24): Promise<{ id: string; name: string; type: string; weight: number }[]> {
    const json = await this.get<{ results?: { tags?: unknown[] } }>("/v2/insights", {
      "filter.type": "urn:tag",
      "signal.interests.entities": seedIds,
      take,
    });
    return (json.results?.tags ?? []).map((t) => {
      const tag = t as Record<string, unknown>;
      const query = (tag.query ?? {}) as Record<string, unknown>;
      return {
        id: String(tag.id ?? tag.tag_id ?? ""),
        name: String(tag.name ?? ""),
        type: String(tag.subtype ?? tag.type ?? ""),
        weight: Number(query.affinity ?? tag.affinity ?? tag.weight ?? 0),
      };
    });
  }

  async findTags(query: string, take = 6): Promise<{ id: string; name: string; type: string }[]> {
    const json = await this.get<{ results?: { tags?: unknown[] } }>("/v2/tags", {
      "filter.query": query,
      take,
    });
    return (json.results?.tags ?? []).map((t) => {
      const tag = t as Record<string, unknown>;
      return {
        id: String(tag.id ?? tag.tag_id ?? ""),
        name: String(tag.name ?? ""),
        type: String(tag.subtype ?? tag.type ?? ""),
      };
    });
  }
}

function num(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

function yearOf(p: Record<string, unknown>): number | null {
  const direct = num(p.release_year) ?? num(p.publication_year) ?? num(p.year);
  if (direct) return Math.round(direct);
  for (const key of ["release_date", "date_of_birth", "publication_date", "founded"]) {
    const v = p[key];
    if (typeof v === "string") {
      const m = v.match(/\d{4}/);
      if (m) return parseInt(m[0], 10);
    }
  }
  return null;
}

function imageOf(p: Record<string, unknown>): string | null {
  const image = p.image as { url?: string } | string | undefined;
  if (typeof image === "string") return image;
  if (image?.url) return image.url;
  const images = p.images as { url?: string }[] | undefined;
  if (Array.isArray(images) && images[0]?.url) return images[0].url;
  return null;
}

function descriptionOf(p: Record<string, unknown>): string | null {
  if (typeof p.short_description === "string") return p.short_description;
  const shorts = p.short_descriptions as { value?: string }[] | undefined;
  if (Array.isArray(shorts) && shorts[0]?.value) return shorts[0].value;
  if (typeof p.description === "string") return p.description.slice(0, 400);
  return null;
}

/** Normalises a raw Qloo search or insights entity into the trimmed shape the app uses. */
export function toEntity(raw: unknown, domain: Domain): Entity | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.entity_id ?? r.id ?? "");
  const name = String(r.name ?? "");
  if (!id || !name) return null;
  const p = (r.properties ?? {}) as Record<string, unknown>;
  const query = (r.query ?? {}) as Record<string, unknown>;
  const tags = Array.isArray(r.tags)
    ? (r.tags as Record<string, unknown>[])
        .map((t) => String(t.name ?? ""))
        .filter(Boolean)
        .slice(0, 8)
    : [];
  const address = typeof p.address === "string" ? p.address : null;
  return {
    id,
    name,
    domain,
    year: yearOf(p),
    image: imageOf(p),
    description: descriptionOf(p),
    tags,
    popularity: num(r.popularity),
    affinity: num(query.affinity),
    address,
  };
}
