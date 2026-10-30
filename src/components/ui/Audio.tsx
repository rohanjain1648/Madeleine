"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Track } from "@/lib/types";

interface AudioState {
  current: Track | null;
  playing: boolean;
  progress: number;
  toggle: (track: Track) => void;
  stop: () => void;
}

const AudioContext = createContext<AudioState | null>(null);

/** One shared player, so starting a song always stops the previous one. */
export function AudioProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = new Audio();
    el.preload = "none";
    el.volume = 0.8;
    const onTime = () => setProgress(el.duration ? el.currentTime / el.duration : 0);
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    el.addEventListener("pause", () => setPlaying(false));
    el.addEventListener("play", () => setPlaying(true));
    audio.current = el;
    return () => {
      el.pause();
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = useCallback(
    (track: Track) => {
      const el = audio.current;
      if (!el || !track.previewUrl) return;
      if (current?.previewUrl === track.previewUrl) {
        if (el.paused) void el.play().catch(() => setPlaying(false));
        else el.pause();
        return;
      }
      el.src = track.previewUrl;
      setCurrent(track);
      setProgress(0);
      void el.play().catch(() => setPlaying(false));
    },
    [current],
  );

  const stop = useCallback(() => {
    audio.current?.pause();
    setPlaying(false);
  }, []);

  return (
    <AudioContext.Provider value={{ current, playing, progress, toggle, stop }}>{children}</AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used inside AudioProvider");
  return ctx;
}

export function isPlaying(state: AudioState, track: Track | null | undefined) {
  return !!track?.previewUrl && state.playing && state.current?.previewUrl === track.previewUrl;
}
