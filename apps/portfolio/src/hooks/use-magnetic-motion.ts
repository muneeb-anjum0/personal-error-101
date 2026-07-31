"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useMotionSettings } from "@/components/motion/reduced-motion-provider";

export function useMagneticMotion<T extends HTMLElement>(strength = 8) {
  const ref = useRef<T>(null);
  const { reducedMotion, pointer } = useMotionSettings();

  useEffect(() => {
    const element = ref.current;
    if (!element || reducedMotion || pointer !== "precise") {
      return;
    }
    const target = element;

    function onMove(event: PointerEvent) {
      const rect = target.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * strength;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * strength;
      gsap.to(target, { x, y, duration: 0.22, ease: "power2.out" });
    }

    function onLeave() {
      gsap.to(target, { x: 0, y: 0, duration: 0.32, ease: "power2.out" });
    }

    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerleave", onLeave);
    return () => {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(target);
    };
  }, [pointer, reducedMotion, strength]);

  return ref;
}
