import type { Domain, MomentKind } from "./types";

export const DOMAIN_COLOR: Record<Domain, string> = {
  music: "var(--color-music)",
  film: "var(--color-film)",
  tv: "var(--color-tv)",
  stars: "var(--color-stars)",
  books: "var(--color-books)",
  brands: "var(--color-brands)",
  destinations: "var(--color-destinations)",
  places: "var(--color-places)",
};

export const DOMAIN_INTRO: Record<Domain, string> = {
  music: "The voices on the radio and the records on the shelf.",
  film: "The pictures they queued round the block to see.",
  tv: "What the family gathered round the set to watch.",
  stars: "Faces they would know anywhere.",
  books: "Stories they read, or had read to them.",
  brands: "Everyday things from the kitchen, the bathroom and the corner shop.",
  destinations: "Places from their life, or ones they always talked about.",
  places: "Somewhere to go together this month.",
};

export const KIND_DOMAIN: Partial<Record<MomentKind, Domain>> = {
  song: "music",
  film: "film",
  tv: "tv",
  star: "stars",
  book: "books",
  brand: "brands",
  place: "places",
};

export const KIND_LABEL: Record<MomentKind, string> = {
  song: "Song",
  film: "Film",
  tv: "Television",
  star: "A familiar face",
  book: "Story",
  brand: "Everyday things",
  place: "A place",
  story: "Their story",
  sensory: "Taste and scent",
};

export const TOOL_LABEL: Record<string, string> = {
  search_qloo: "Finding them in the taste graph",
  taste_fingerprint: "Reading their taste fingerprint",
  discover: "Exploring what they'd love",
  rank_by_taste: "Ranking era favourites by taste",
  find_tags: "Looking up a genre",
};
