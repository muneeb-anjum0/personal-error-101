"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsapEasings } from "@/lib/animation/easings";
import { useMotionSettings } from "./reduced-motion-provider";

gsap.registerPlugin(ScrollTrigger);

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  pattern?: "rise" | "side" | "line" | "stagger" | "hero";
  as?: "div" | "section";
}

export function Reveal({ children, className, pattern = "rise", as: Tag = "div" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const { reducedMotion } = useMotionSettings();

  useEffect(() => {
    const element = ref.current;
    if (!element || reducedMotion) {
      return;
    }

    const context = gsap.context(() => {
      const targets =
        pattern === "hero"
          ? element.querySelectorAll("[data-hero-reveal]")
          : pattern === "stagger"
          ? Array.from(element.children)
          : pattern === "line"
            ? element.querySelectorAll(".motion-line")
            : [element];
      const heroReveal = pattern === "hero";

      gsap.fromTo(
        targets,
        {
          opacity: pattern === "line" ? 1 : 0,
          y: heroReveal ? 34 : pattern === "side" ? 0 : 18,
          x: pattern === "side" ? -18 : 0,
          clipPath:
            pattern === "line"
              ? "inset(0 100% 0 0)"
              : heroReveal
                ? "inset(0 0 100% 0)"
                : "inset(0 0% 0 0)"
        },
        {
          opacity: 1,
          y: 0,
          x: 0,
          clipPath: "inset(0 0% 0 0)",
          duration: pattern === "line" ? 0.58 : heroReveal ? 0.82 : 0.7,
          ease: heroReveal ? gsapEasings.emphasis : gsapEasings.entrance,
          stagger: pattern === "stagger" || pattern === "line" ? 0.08 : heroReveal ? 0.13 : 0,
          scrollTrigger: {
            trigger: element,
            start: "top 84%",
            once: true
          }
        }
      );
    }, element);

    return () => context.revert();
  }, [pattern, reducedMotion]);

  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {children}
    </Tag>
  );
}
