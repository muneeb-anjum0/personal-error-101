"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePointerCapability } from "@/hooks/use-pointer-capability";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion";
import { selectAnimationMode, type AnimationMode } from "@/lib/performance/animation-budget";
import type { PointerCapability } from "@/lib/performance/device-capability";

interface MotionSettings {
  reducedMotion: boolean;
  pointer: PointerCapability;
  mode: AnimationMode;
}

const MotionSettingsContext = createContext<MotionSettings>({
  reducedMotion: false,
  pointer: "none",
  mode: "minimal"
});

export function ReducedMotionProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotionPreference();
  const pointer = usePointerCapability();
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const value = useMemo(
    () => ({
      reducedMotion,
      pointer,
      mode: selectAnimationMode({ pointer, reducedMotion, width })
    }),
    [pointer, reducedMotion, width]
  );

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? "reduced" : value.mode;
    document.documentElement.dataset.pointer = pointer;
  }, [pointer, reducedMotion, value.mode]);

  return <MotionSettingsContext.Provider value={value}>{children}</MotionSettingsContext.Provider>;
}

export function useMotionSettings() {
  return useContext(MotionSettingsContext);
}
