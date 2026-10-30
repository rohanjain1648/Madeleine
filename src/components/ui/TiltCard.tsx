"use client";

import clsx from "clsx";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { ReactNode } from "react";

/** Tilts toward the pointer with a sheen of projector light across the surface. */
export function TiltCard({
  children,
  className,
  max = 9,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const spring = { stiffness: 220, damping: 20, mass: 0.6 };
  const rotateX = useSpring(useTransform(y, [0, 1], [max, -max]), spring);
  const rotateY = useSpring(useTransform(x, [0, 1], [-max, max]), spring);
  const gx = useTransform(x, (v) => `${v * 100}%`);
  const gy = useTransform(y, (v) => `${v * 100}%`);
  const sheen = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgb(255 236 200 / 0.32), transparent 52%)`;

  return (
    <motion.div
      className={clsx("relative [transform-style:preserve-3d]", className)}
      style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType === "touch") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width);
        y.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        x.set(0.5);
        y.set(0.5);
      }}
    >
      {children}
      {glare && !reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 mix-blend-soft-light"
          style={{ background: sheen }}
        />
      )}
    </motion.div>
  );
}
