"use client";

import { motion } from "motion/react";
import { revealVariants } from "@/lib/animation/motion-variants";

export function RouteTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={revealVariants}>
      {children}
    </motion.div>
  );
}
