"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotionSettings } from "./reduced-motion-provider";

gsap.registerPlugin(ScrollTrigger);

export function ScrollProgress() {
  const progressRef = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useMotionSettings();

  useEffect(() => {
    const progress = progressRef.current;
    if (!progress || reducedMotion) {
      return;
    }

    const tween = gsap.to(progress, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        start: 0,
        end: "max",
        scrub: 0.15
      }
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reducedMotion]);

  return <div ref={progressRef} className="scroll-progress" aria-hidden="true" />;
}
