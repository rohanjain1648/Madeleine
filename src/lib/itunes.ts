import "server-only";
import type { Track } from "./types";

// Apple's public search API: no key, ~20 calls/minute per IP, so results are cached.
const cache = new Map<string, Track | null>();

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function findTrack(artist: string, title: string): Promise<Track | null> {
  const key = `${norm(artist)}|${norm(title)}`;
  if (cache.has(key)) return cache.get(key) ?? null;

  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", `${artist} ${title}`);
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", "8");

  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { results?: Record<string, unknown>[] };
    const results = json.results ?? [];
    const a = norm(artist);
    const t = norm(title);
    const scored = results
      .map((r) => {
        const ra = norm(String(r.artistName ?? ""));
        const rt = norm(String(r.trackName ?? ""));
        let score = 0;
        if (ra === a) score += 3;
        else if (ra.includes(a) || a.includes(ra)) score += 2;
        if (rt === t) score += 3;
        else if (rt.startsWith(t) || rt.includes(t)) score += 2;
        if (r.previewUrl) score += 1;
        return { r, score };
      })
      .sort((x, y) => y.score - x.score);
    const best = scored[0];
    if (!best || best.score < 4) {
      cache.set(key, null);
      return null;
    }
    const r = best.r;
    const release = typeof r.releaseDate === "string" ? parseInt(r.releaseDate.slice(0, 4), 10) : NaN;
    const track: Track = {
      title: String(r.trackName ?? title),
      artist: String(r.artistName ?? artist),
      album: r.collectionName ? String(r.collectionName) : null,
      year: Number.isFinite(release) ? release : null,
      previewUrl: r.previewUrl ? String(r.previewUrl) : null,
      artwork: r.artworkUrl100 ? String(r.artworkUrl100).replace("100x100bb", "600x600bb") : null,
      url: r.trackViewUrl ? String(r.trackViewUrl) : null,
    };
    cache.set(key, track);
    return track;
  } catch {
    return null;
  }
}
