import { afterEach, describe, expect, it, vi } from "vitest";
import { selectAnimationMode } from "../src/lib/performance/animation-budget";
import { getPointerCapability } from "../src/lib/performance/device-capability";

describe("animation budget selection", () => {
  it("uses minimal mode for reduced motion", () => {
    expect(selectAnimationMode({ pointer: "precise", reducedMotion: true, width: 1440 })).toBe(
      "minimal"
    );
  });

  it("uses balanced mode on tablets or non-precise pointers", () => {
    expect(selectAnimationMode({ pointer: "precise", reducedMotion: false, width: 900 })).toBe(
      "balanced"
    );
    expect(selectAnimationMode({ pointer: "coarse", reducedMotion: false, width: 1440 })).toBe(
      "balanced"
    );
  });

  it("allows full mode only on large precise-pointer screens", () => {
    expect(selectAnimationMode({ pointer: "precise", reducedMotion: false, width: 1440 })).toBe(
      "full"
    );
  });
});

describe("pointer capability detection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("detects precise pointer devices", () => {
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({ matches: query.includes("hover: hover") })
    });

    expect(getPointerCapability()).toBe("precise");
  });

  it("detects coarse pointer devices", () => {
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({ matches: query.includes("pointer: coarse") })
    });

    expect(getPointerCapability()).toBe("coarse");
  });
});
