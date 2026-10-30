"use client";

import { useState } from "react";
import clsx from "clsx";
import type { Domain } from "@/lib/types";
import { DOMAIN_COLOR } from "@/lib/domains";

/**
 * An image that develops like a print in a darkroom tray. When there is no
 * picture, it shows a toned print with the subject's initials instead of a broken image.
 */
export function Photo({
  src,
  alt,
  domain,
  className,
  imgClassName,
  develop = true,
}: {
  src: string | null | undefined;
  alt: string;
  domain: Domain;
  className?: string;
  imgClassName?: string;
  develop?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const initials = alt
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className={clsx("relative overflow-hidden bg-umber-800", className)}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={clsx("size-full object-cover", develop && "animate-develop", imgClassName)}
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="flex size-full items-center justify-center"
          style={{
            background: `radial-gradient(120% 90% at 30% 20%, color-mix(in oklab, ${DOMAIN_COLOR[domain]} 70%, white 10%), color-mix(in oklab, ${DOMAIN_COLOR[domain]} 35%, #1b1310) 70%)`,
          }}
        >
          <span className="display text-4xl text-umber-950/70">{initials}</span>
        </div>
      )}
    </div>
  );
}
