"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Profile } from "@muneeb-systems/shared-types";
import { useMotionSettings } from "@/components/motion/reduced-motion-provider";
import { SectionHeading } from "@/components/ui/section-heading";

gsap.registerPlugin(ScrollTrigger);

export function PhilosophySection({ profile }: { profile: Profile }) {
  const ref = useRef<HTMLElement>(null);
  const { mode, reducedMotion } = useMotionSettings();
  const statementLines =
    profile.philosophyStatementLines.length > 0
      ? profile.philosophyStatementLines
      : ["SYSTEMS", "SHOULD FEEL", "USEFUL."];
  const principles = profile.philosophyPrinciples;

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
            start: "top 72%",
            end: "bottom 62%",
            scrub: 0.35
          }
        }
      );
    }, section);

    return () => context.revert();
  }, [mode, reducedMotion]);

  return (
    <section ref={ref} id="philosophy" className="portfolio-section philosophy-section">
      <SectionHeading
        label="06 / PHILOSOPHY"
        heading={profile.philosophyHeading ?? "WORK PRINCIPLES."}
      />
      <div className="philosophy-grid">
        <p>
          {statementLines.map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
        </p>
        {principles.length > 0 ? (
          <ol>
            {principles.map((principle, index) => (
              <li key={principle}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {principle}
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  );
}
