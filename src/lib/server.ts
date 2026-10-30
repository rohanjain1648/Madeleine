import "server-only";
import { z } from "zod";
import type { AgentEvent } from "./types";

export const IntakeSchema = z.object({
  name: z.string().trim().min(1).max(60),
  birthYear: z.coerce.number().int().min(1915).max(new Date().getFullYear() - 20),
  hometown: z.string().trim().min(2).max(120),
  currentCity: z.string().trim().max(120).default(""),
  language: z.string().trim().max(40).default("English"),
  loves: z.string().trim().min(3).max(1200),
  lifeStory: z.string().trim().max(1200).default(""),
  avoid: z.string().trim().max(600).default(""),
});

const hits = new Map<string, number[]>();

/** A small per-instance limiter so a public demo can't drain the API quotas. */
export function rateLimited(req: Request, limit = 8, windowMs = 10 * 60 * 1000) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export function friendlyError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  if (/rate limit|429|tokens per minute/i.test(message)) {
    return "Madeleine is very popular right now and hit an AI rate limit. Wait a minute and try again.";
  }
  if (/QLOO_API_KEY|GROQ_API_KEY|api key/i.test(message)) return "The server is missing an API key.";
  return message.slice(0, 240);
}

/** Streams agent events to the browser as newline-delimited JSON. */
export function ndjson(run: (emit: (e: AgentEvent) => void) => Promise<void>) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: AgentEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
        } catch {
          // client went away
        }
      };
      try {
        await run(emit);
      } catch (err) {
        console.error(err);
        emit({ type: "error", message: friendlyError(err) });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
