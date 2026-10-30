"use client";

import { useSyncExternalStore } from "react";
import type { Profile } from "./types";

// Profiles live in the browser: nothing about a family's loved one is stored on a server.
const KEY = "madeleine:profiles:v1";
const EMPTY: Record<string, Profile> = {};
let cache: Record<string, Profile> | null = null;
const listeners = new Set<() => void>();

function read(): Record<string, Profile> {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, Profile>;
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: Record<string, Profile>) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked: keep the in-memory copy for this visit
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function saveProfile(profile: Profile) {
  write({ ...read(), [profile.id]: profile });
}

export function updateProfile(id: string, fn: (p: Profile) => Profile) {
  const all = read();
  const current = all[id];
  if (current) write({ ...all, [id]: fn(current) });
}

export function deleteProfile(id: string) {
  const rest = { ...read() };
  delete rest[id];
  write(rest);
}

export function useProfiles() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useProfile(id: string | undefined) {
  const all = useProfiles();
  return id ? (all[id] ?? null) : null;
}

const noop = () => () => {};
/** False during server render and hydration, true once the browser store is readable. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
