import "server-only";
import { createGroq } from "@ai-sdk/groq";

export const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

/** Models are configurable so the deploy can follow Groq's current lineup and rate limits. */
export const MODELS = {
  curator: process.env.GROQ_CURATOR_MODEL ?? "openai/gpt-oss-120b",
  designer: process.env.GROQ_DESIGNER_MODEL ?? "openai/gpt-oss-120b",
  fallback: process.env.GROQ_FALLBACK_MODEL ?? "moonshotai/kimi-k2-instruct-0905",
};
