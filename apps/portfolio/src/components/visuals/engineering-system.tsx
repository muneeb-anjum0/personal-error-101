"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useMotionSettings } from "@/components/motion/reduced-motion-provider";

const nodes = [
  { id: "ai", label: "AI", x: 75, y: 50 },
  { id: "security", label: "SECURITY", x: 330, y: 58 },
  { id: "backend", label: "BACKEND", x: 80, y: 205 },
  { id: "products", label: "PRODUCTS", x: 330, y: 205 },
  { id: "systems", label: "SYSTEMS", x: 205, y: 22 },
  { id: "research", label: "RESEARCH", x: 205, y: 242 }
];

export function EngineeringSystem() {
  const figureRef = useRef<HTMLElement>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const { mode, reducedMotion } = useMotionSettings();

  useEffect(() => {
    const figure = figureRef.current;
    if (!figure || reducedMotion) {
      return;
    }

    const context = gsap.context(() => {
      gsap.set(".system-lines line", { transformOrigin: "210px 145px", scaleX: 0, opacity: 0.45 });
      gsap.set(".system-node", { opacity: 0, y: 6 });
      gsap.set(".system-core", { opacity: 0, scale: 0.96, transformOrigin: "center" });
      gsap
        .timeline({ delay: 0.15 })
        .to(".system-core", { opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" })
        .to(
          ".system-lines line",
          { scaleX: 1, opacity: 1, duration: 0.65, ease: "power2.inOut", stagger: 0.05 },
          "-=0.2"
        )
        .to(
          ".system-node",
          { opacity: 1, y: 0, duration: 0.42, ease: "power2.out", stagger: 0.05 },
          "-=0.25"
        )
        .fromTo(
          ".svg-meta",
          { opacity: 0 },
          { opacity: 0.55, duration: 0.32, stagger: 0.02 },
          "-=0.2"
        );

      if (mode === "full") {
        gsap.to(".system-pulse", {
          strokeDashoffset: -120,
          duration: 5.5,
          ease: "none",
          repeat: -1
        });
      }
    }, figure);

    return () => context.revert();
  }, [mode, reducedMotion]);

  return (
    <figure
      ref={figureRef}
      className={`engineering-system${activeNode ? " system-has-active-node" : ""}`}
      aria-labelledby="engineering-system-title"
    >
      <svg viewBox="0 0 420 290" role="img" focusable="false">
        <title id="engineering-system-title">
          Engineering system diagram connecting engineer to AI, security, backend, products,
          systems, and research.
        </title>
        <g className="system-lines">
          {nodes.map((node) => (
            <line
              key={node.id}
              className={activeNode === node.id ? "is-active" : undefined}
              data-node={node.id}
              x1="210"
              y1="145"
              x2={node.x}
              y2={node.y}
            />
          ))}
        </g>
        <g className="system-pulse" aria-hidden="true">
          <path d="M210 145 L75 50 L205 22 L330 58" />
        </g>
        <g className="system-core">
          <rect x="154" y="111" width="112" height="68" rx="2" />
          <text x="210" y="141" textAnchor="middle">
            ENGINEER
          </text>
          <text x="210" y="161" textAnchor="middle" className="svg-meta">
            CORE / 00
          </text>
        </g>
        {nodes.map((node, index) => (
          <g
            key={node.id}
            className={activeNode === node.id ? "system-node is-active" : "system-node"}
            tabIndex={0}
            aria-label={`${node.label} node`}
            onBlur={() => setActiveNode(null)}
            onFocus={() => setActiveNode(node.id)}
            onMouseEnter={() => setActiveNode(node.id)}
            onMouseLeave={() => setActiveNode(null)}
          >
            <rect x={node.x - 48} y={node.y - 18} width="96" height="36" rx="18" />
            <text x={node.x} y={node.y + 4} textAnchor="middle">
              {node.label}
            </text>
            <text x={node.x} y={node.y + 35} textAnchor="middle" className="svg-meta">
              X{node.x} / Y{node.y} / 0{index + 1}
            </text>
          </g>
        ))}
      </svg>
      <figcaption>
        {activeNode
          ? `${nodes.find((node) => node.id === activeNode)?.label} LINK ACTIVE`
          : "Engineering map online with motion-safe system links."}
      </figcaption>
    </figure>
  );
}
