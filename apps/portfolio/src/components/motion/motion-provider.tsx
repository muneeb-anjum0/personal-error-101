"use client";

import { ReducedMotionProvider } from "./reduced-motion-provider";
import { ScrollProgress } from "./scroll-progress";
import { SmoothScrollProvider } from "./smooth-scroll-provider";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReducedMotionProvider>
      {children}
      <SmoothScrollProvider />
      <ScrollProgress />
    </ReducedMotionProvider>
  );
}
