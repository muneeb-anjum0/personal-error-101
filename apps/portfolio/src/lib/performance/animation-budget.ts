import type { PointerCapability } from "./device-capability";

export type AnimationMode = "full" | "balanced" | "minimal";

export function selectAnimationMode({
  pointer,
  reducedMotion,
  width
}: {
  pointer: PointerCapability;
  reducedMotion: boolean;
  width: number;
}): AnimationMode {
  if (reducedMotion || width < 760) {
    return "minimal";
  }

  if (pointer !== "precise" || width < 1100) {
    return "balanced";
  }

  return "full";
}
