"use client";

import React, { useCallback, useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { SPRING } from "@/lib/motion";

type GlowHoverCardProps = {
  className?: string;
  children: React.ReactNode;
  hoverScale?: number;
  glowSize?: number;
};

export function GlowHoverCard({
  className,
  children,
  hoverScale = 1.05,
  glowSize = 240,
}: GlowHoverCardProps) {
  const [hovered, setHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const background = useMotionTemplate`radial-gradient(${glowSize}px circle at ${mouseX}px ${mouseY}px, color-mix(in srgb, var(--foreground) 18%, transparent), transparent 62%)`;

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  return (
    <motion.div
      className={className}
      onMouseMove={onMouseMove}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: hoverScale }}
      transition={SPRING}
      style={{ position: "relative" }}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background, borderRadius: "inherit" }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={SPRING}
      />
      {children}
    </motion.div>
  );
}
