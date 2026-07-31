"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotionSettings } from "@/components/motion/reduced-motion-provider";
import { SectionHeading } from "@/components/ui/section-heading";

gsap.registerPlugin(ScrollTrigger);

const principles = [
  "Build for actual problems",
  "Understand the entire system",
  "Automate repetitive work",
  "Measure before claiming improvement",
  "Keep learning"
];

export function PhilosophySection() {
  const ref = useRef<HTMLElement>(null);
  const { mode, reducedMotion } = useMotionSettings();

  useEffect(() => {
    const section = ref.current;
    if (!section || reducedMotion || mode !== "full") {
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        ".philosophy-grid > p span",
        { opacity: 0.22, y: 16 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 50%",
            end: "+=420",
            scrub: 0.4,
            pin: ".philosophy-grid",
            anticipatePin: 1
          }
        }
      );
    }, section);

    return () => context.revert();
  }, [mode, reducedMotion]);

  return (
    <section ref={ref} id="philosophy" className="portfolio-section philosophy-section">
      <SectionHeading label="06 / PHILOSOPHY" heading="CODE IS NOT THE PRODUCT." />
      <div className="philosophy-grid">
        <p>
          <span>THE SYSTEM,</span>
          <br />
          <span>THE EXPERIENCE,</span>
          <br />
          <span>AND THE RESULT</span>
          <br />
          <span>ARE THE PRODUCT.</span>
        </p>
        <ol>
          {principles.map((principle, index) => (
            <li key={principle}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {principle}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
