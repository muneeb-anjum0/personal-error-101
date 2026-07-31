"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { cursorLabels, CursorProvider, type CursorState } from "./cursor-context";
import { useMotionSettings } from "@/components/motion/reduced-motion-provider";

export function CustomCursor() {
  const pointRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CursorState>("DEFAULT");
  const { mode, pointer, reducedMotion } = useMotionSettings();
  const enabled = pointer === "precise" && mode === "full" && !reducedMotion;

  const contextValue = useMemo(() => ({ state, setState }), [state]);

  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove("custom-cursor-enabled");
      return;
    }

    const point = pointRef.current;
    const ring = ringRef.current;
    if (!point || !ring) {
      return;
    }

    document.documentElement.classList.add("custom-cursor-enabled");

    const pointX = gsap.quickTo(point, "x", { duration: 0.08, ease: "power2.out" });
    const pointY = gsap.quickTo(point, "y", { duration: 0.08, ease: "power2.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.24, ease: "power2.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.24, ease: "power2.out" });

    function onPointerMove(event: PointerEvent) {
      pointX(event.clientX);
      pointY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
    }

    function onPointerOver(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const cursor = target.closest<HTMLElement>("[data-cursor]");
      setState((cursor?.dataset.cursor as CursorState | undefined) ?? "DEFAULT");
    }

    window.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerover", onPointerOver);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.documentElement.classList.remove("custom-cursor-enabled");
      gsap.killTweensOf([point, ring]);
    };
  }, [enabled]);

  return (
    <CursorProvider value={contextValue}>
      {enabled ? (
        <div className="custom-cursor" aria-hidden="true">
          <div ref={ringRef} className={`cursor-ring cursor-${state.toLowerCase()}`}>
            {cursorLabels[state] ? <span>{cursorLabels[state]}</span> : null}
          </div>
          <div ref={pointRef} className="cursor-point" />
        </div>
      ) : null}
    </CursorProvider>
  );
}
