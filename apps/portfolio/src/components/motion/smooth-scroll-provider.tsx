"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotionSettings } from "./reduced-motion-provider";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScrollProvider() {
  const { mode, reducedMotion } = useMotionSettings();

  useEffect(() => {
    if (reducedMotion || mode === "minimal") {
      document.documentElement.classList.remove("lenis-active");
      return;
    }

    const lenis = new Lenis({
      duration: 0.85,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      anchors: true
    });

    document.documentElement.classList.add("lenis-active");
    const updateScrollTrigger = () => ScrollTrigger.update();

    const update = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", updateScrollTrigger);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.off("scroll", updateScrollTrigger);
      lenis.destroy();
      document.documentElement.classList.remove("lenis-active");
    };
  }, [mode, reducedMotion]);

  return null;
}
