"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

type RevealElement = "div" | "li" | "section" | "article";

export type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger offset in seconds, for items revealed as a group. */
  delay?: number;
  as?: RevealElement;
};

/**
 * One scroll-triggered motion primitive for the whole site: a short, low
 * amplitude rise. Everything that moves uses this, so the page never
 * accumulates a zoo of different animations. Fully disabled under
 * `prefers-reduced-motion`.
 */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return React.createElement(as, { className }, children);
  }

  const shared = {
    className: cn(className),
    initial: { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as const },
  };

  switch (as) {
    case "li":
      return <motion.li {...shared}>{children}</motion.li>;
    case "section":
      return <motion.section {...shared}>{children}</motion.section>;
    case "article":
      return <motion.article {...shared}>{children}</motion.article>;
    default:
      return <motion.div {...shared}>{children}</motion.div>;
  }
}
