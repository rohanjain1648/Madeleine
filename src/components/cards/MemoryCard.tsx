"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import { Heart, MapPin, Pause, Play } from "lucide-react";
import type { Entity, Track, WorldItem } from "@/lib/types";
import { DOMAIN_COLOR } from "@/lib/domains";
import { Photo } from "../ui/Photo";
import { TiltCard } from "../ui/TiltCard";
import { isPlaying, useAudio } from "../ui/Audio";

function isFavourite(item?: WorldItem) {
  return !!item?.why.startsWith("Named by the family");
}

function TrackButton({ track }: { track: Track }) {
  const audio = useAudio();
  const on = isPlaying(audio, track);
  if (!track.previewUrl) return null;
  return (
    <button
      type="button"
      onClick={() => audio.toggle(track)}
      className={clsx(
        "group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[0.9rem] transition-colors",
        on ? "bg-music/15 text-paper" : "text-paper-dim hover:bg-paper/5 hover:text-paper",
      )}
      aria-label={`${on ? "Pause" : "Play"} ${track.title}`}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-music text-umber-950">
        {on ? <Pause className="size-3.5" fill="currentColor" /> : <Play className="size-3.5 translate-x-px" fill="currentColor" />}
      </span>
      <span className="min-w-0 truncate">
        {track.title}
        {track.year ? <span className="text-smoke"> {track.year}</span> : null}
      </span>
    </button>
  );
}

function Caption({ entity, item, dark = false }: { entity: Entity; item?: WorldItem; dark?: boolean }) {
  return (
    <div className={clsx("mt-3 space-y-1", dark ? "text-umber-900" : "text-paper")}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="display-soft text-[1.2rem] leading-tight">{entity.name}</h3>
        {isFavourite(item) && (
          <Heart className="mt-1 size-4 shrink-0 text-film" fill="currentColor" aria-label="Family favourite" />
        )}
      </div>
      {item?.why && !isFavourite(item) && (
        <p className={clsx("text-[0.88rem] leading-snug", dark ? "text-umber-700" : "text-smoke")}>{item.why}</p>
      )}
    </div>
  );
}

export function MemoryCard({ entity, item, index = 0 }: { entity: Entity; item?: WorldItem; index?: number }) {
  const tracks = item?.tracks ?? [];
  const art = entity.image ?? tracks[0]?.artwork ?? null;
  const tilt = (index % 2 ? 1 : -1) * ((index % 3) + 1) * 0.6;

  const body = (() => {
    switch (entity.domain) {
      case "music":
        return (
          <div className="group">
            <div className="relative aspect-square">
              <div
                className="vinyl absolute inset-[6%] transition-transform duration-700 [transition-timing-function:var(--ease-soft)] group-hover:translate-x-[22%] group-hover:rotate-45"
                style={{ ["--label" as string]: DOMAIN_COLOR.music }}
              />
              <Photo src={art} alt={entity.name} domain="music" className="relative aspect-square rounded-[3px] shadow-[0_18px_40px_-18px_rgb(0_0_0/0.9)]" />
            </div>
            <Caption entity={entity} item={item} />
            {tracks.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {tracks.map((t) => (
                  <TrackButton key={t.previewUrl ?? t.title} track={t} />
                ))}
              </div>
            )}
          </div>
        );
      case "film":
        return (
          <div>
            <div className="slide-mount">
              <Photo src={art} alt={entity.name} domain="film" className="slide-window aspect-[4/3]" />
              <div className="mt-2 flex justify-between font-semibold text-[0.72rem] text-umber-700">
                <span className="truncate pr-2">{entity.name}</span>
                <span>{entity.year ?? ""}</span>
              </div>
            </div>
            <Caption entity={entity} item={item} />
          </div>
        );
      case "tv":
        return (
          <div>
            <div className="crt">
              <Photo src={art} alt={entity.name} domain="tv" className="crt-screen aspect-[4/3]" imgClassName="saturate-[0.8]" />
            </div>
            <Caption entity={entity} item={item} />
          </div>
        );
      case "stars":
        return (
          <div>
            <div className="polaroid" style={{ transform: `rotate(${tilt}deg)` }}>
              <Photo src={art} alt={entity.name} domain="stars" className="aspect-square" imgClassName="sepia-[0.25]" />
              <p className="display-soft mt-2 text-center text-[1.05rem] italic text-umber-800">{entity.name}</p>
            </div>
            {item?.why && !isFavourite(item) && <p className="mt-3 text-[0.88rem] leading-snug text-smoke">{item.why}</p>}
          </div>
        );
      case "books":
        return (
          <div>
            <div className="relative ml-2 aspect-[2/3] max-w-[78%]">
              <div className="absolute -left-2 top-1 bottom-1 w-3 rounded-l-sm bg-books/60" />
              <Photo src={art} alt={entity.name} domain="books" className="relative size-full rounded-r-sm shadow-[0_18px_36px_-16px_rgb(0_0_0/0.9)]" />
            </div>
            <Caption entity={entity} item={item} />
          </div>
        );
      case "brands":
        return (
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-gradient-to-br from-brands/80 to-brands/30 p-2 shadow-[0_16px_34px_-16px_rgb(0_0_0/0.9)]">
              <Photo src={art} alt={entity.name} domain="brands" className="size-32 rounded-full border-4 border-paper/80" />
            </div>
            <Caption entity={entity} item={item} />
          </div>
        );
      case "destinations":
        return (
          <div>
            <div className="postcard relative p-3" style={{ transform: `rotate(${-tilt}deg)` }}>
              <Photo src={art} alt={entity.name} domain="destinations" className="aspect-[3/2]" />
              <div className="mt-2 flex items-end justify-between">
                <p className="display-soft text-[1.15rem] italic text-umber-800">Greetings from {entity.name}</p>
                <span className="rounded-sm border-2 border-dashed border-destinations/70 px-1.5 py-1 text-[0.6rem] font-bold text-destinations">
                  {entity.year ?? "AIR MAIL"}
                </span>
              </div>
            </div>
            {item?.why && <p className="mt-3 text-[0.88rem] leading-snug text-smoke">{item.why}</p>}
          </div>
        );
      case "places":
        return (
          <div className="ticket px-6 py-4 text-umber-900">
            <p className="text-[0.72rem] font-bold text-places">An outing</p>
            <h3 className="display-soft mt-1 text-[1.25rem] leading-tight">{entity.name}</h3>
            {entity.address && (
              <p className="mt-1 flex items-start gap-1 text-[0.8rem] text-umber-700">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                <span className="line-clamp-2">{entity.address}</span>
              </p>
            )}
            {item?.why && <p className="mt-2 border-t border-dashed border-umber-600/40 pt-2 text-[0.85rem] leading-snug text-umber-800">{item.why}</p>}
          </div>
        );
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: (index % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard>{body}</TiltCard>
    </motion.div>
  );
}
