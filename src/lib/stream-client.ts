"use client";

import type { AgentEvent } from "./types";

/** POSTs JSON and calls `onEvent` for each NDJSON line the agent route streams back. */
export async function streamAgent(url: string, body: unknown, onEvent: (e: AgentEvent) => void, signal?: AbortSignal) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const json = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(json?.error ?? `Request failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) onEvent(JSON.parse(line) as AgentEvent);
    }
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer) as AgentEvent);
}
