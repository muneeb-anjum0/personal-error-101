export type PointerCapability = "precise" | "coarse" | "none";

export function getPointerCapability(): PointerCapability {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "none";
  }

  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return "precise";
  }

  if (window.matchMedia("(pointer: coarse)").matches) {
    return "coarse";
  }

  return "none";
}

export function isCompactViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
}
