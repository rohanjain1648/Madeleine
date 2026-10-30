export type Domain =
  | "music"
  | "film"
  | "tv"
  | "stars"
  | "books"
  | "brands"
  | "destinations"
  | "places";

export const DOMAINS: Domain[] = [
  "music",
  "film",
  "tv",
  "stars",
  "books",
  "brands",
  "destinations",
  "places",
];

/** Qloo `filter.type` for each domain. */
export const DOMAIN_TYPES: Record<Domain, string> = {
  music: "urn:entity:artist",
  film: "urn:entity:movie",
  tv: "urn:entity:tv_show",
  stars: "urn:entity:person",
  books: "urn:entity:book",
  brands: "urn:entity:brand",
  destinations: "urn:entity:destination",
  places: "urn:entity:place",
};

export const DOMAIN_LABELS: Record<Domain, string> = {
  music: "Music",
  film: "Films",
  tv: "Television",
  stars: "Faces",
  books: "Books",
  brands: "Everyday things",
  destinations: "Places they knew",
  places: "Outings nearby",
};

export interface Intake {
  name: string;
  birthYear: number;
  hometown: string;
  currentCity: string;
  language: string;
  loves: string;
  lifeStory: string;
  avoid: string;
}

export interface Entity {
  id: string;
  name: string;
  domain: Domain;
  year: number | null;
  image: string | null;
  description: string | null;
  tags: string[];
  popularity: number | null;
  affinity: number | null;
  address: string | null;
}

export interface Track {
  title: string;
  artist: string;
  album: string | null;
  year: number | null;
  previewUrl: string | null;
  artwork: string | null;
  url: string | null;
}

export interface WorldItem {
  entityId: string;
  domain: Domain;
  why: string;
  tracks: Track[];
}

export type MomentKind =
  | "song"
  | "film"
  | "tv"
  | "star"
  | "book"
  | "brand"
  | "place"
  | "story"
  | "sensory";

export interface Moment {
  id: string;
  kind: MomentKind;
  entityId: string | null;
  title: string;
  track: Track | null;
  prompts: string[];
  caregiverTip: string;
  sensory: string | null;
  minutes: number;
}

export type Reaction = "lit" | "engaged" | "neutral" | "distressed";

export const REACTIONS: { id: Reaction; label: string; hint: string }[] = [
  { id: "lit", label: "Lit up", hint: "Smiled, sang, told a story" },
  { id: "engaged", label: "Engaged", hint: "Listened or looked with interest" },
  { id: "neutral", label: "No response", hint: "Didn't seem to connect" },
  { id: "distressed", label: "Upset", hint: "Seemed sad, anxious or confused" },
];

export interface Session {
  id: string;
  number: number;
  title: string;
  theme: string;
  createdAt: string;
  moments: Moment[];
  reactions: Record<string, Reaction>;
  notes: Record<string, string>;
  completedAt: string | null;
  learned: string[];
}

export interface TasteTag {
  name: string;
  weight: number;
}

export interface Profile {
  id: string;
  createdAt: string;
  intake: Intake;
  era: { from: number; to: number };
  portrait: string;
  tasteSummary: string;
  tasteTags: TasteTag[];
  entities: Record<string, Entity>;
  world: WorldItem[];
  seeds: string[];
  learned: { boost: string[]; exclude: string[] };
  sessions: Session[];
  sensoryKit: { item: string; why: string }[];
  outings: { entityId: string; why: string }[];
  avoid: string[];
  stats: { qlooCalls: number; llmSteps: number; ms: number; model: string };
}

export interface ToolPreview {
  id: string;
  name: string;
  image: string | null;
  domain: Domain | null;
  year: number | null;
}

/** One line of the NDJSON stream the agent routes send to the browser. */
export type AgentEvent =
  | { type: "phase"; phase: "curate" | "design" | "hydrate" | "reflect" | "done"; label: string }
  | { type: "tool-start"; id: string; name: string; intent: string }
  | { type: "tool-end"; id: string; name: string; summary: string; ms: number; preview: ToolPreview[] }
  | { type: "tool-error"; id: string; name: string; summary: string }
  | { type: "thought"; text: string }
  | { type: "profile"; profile: Profile }
  | { type: "session"; session: Session; entities: Record<string, Entity>; world: WorldItem[]; learned: Profile["learned"] }
  | { type: "error"; message: string };
