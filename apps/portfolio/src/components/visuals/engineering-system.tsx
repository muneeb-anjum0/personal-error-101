"use client";

import { useState } from "react";

const stages = [
  { id: "understand", index: "01", label: "UNDERSTAND", detail: "CONTEXT + CONSTRAINTS" },
  { id: "engineer", index: "02", label: "ENGINEER", detail: "DESIGN + BUILD" },
  { id: "deliver", index: "03", label: "DELIVER", detail: "RELIABLE SYSTEM" }
];

export function EngineeringSystem() {
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const active = stages.find((stage) => stage.id === activeStage);

  return (
    <figure className="engineering-system" aria-labelledby="engineering-system-title">
      <svg viewBox="0 0 520 280" role="img" focusable="false">
        <title id="engineering-system-title">
          A three-stage engineering flow from understanding a problem to delivering a reliable
          system.
        </title>

        <text x="18" y="25" className="system-kicker">
          ENGINEERING SYSTEM / 01
        </text>
        <text x="502" y="25" textAnchor="end" className="svg-meta">
          INPUT → OUTPUT
        </text>

        <line className="system-rail" x1="56" y1="132" x2="464" y2="132" />
        <line className="system-rail system-rail-progress" x1="56" y1="132" x2="464" y2="132" />

        {stages.map((stage, index) => {
          const x = 92 + index * 168;
          const isActive = activeStage === stage.id;
          return (
            <g
              key={stage.id}
              className={`system-stage${isActive ? " is-active" : ""}`}
              tabIndex={0}
              aria-label={`${stage.label}: ${stage.detail}`}
              onBlur={() => setActiveStage(null)}
              onFocus={() => setActiveStage(stage.id)}
              onMouseEnter={() => setActiveStage(stage.id)}
              onMouseLeave={() => setActiveStage(null)}
            >
              <circle cx={x} cy="132" r="7" />
              <rect x={x - 62} y="72" width="124" height="42" rx="2" />
              <text x={x - 50} y="89" className="svg-meta">
                {stage.index}
              </text>
              <text x={x - 50} y="104">
                {stage.label}
              </text>
              <line x1={x} y1="114" x2={x} y2="125" />
              <text x={x} y="166" textAnchor="middle" className="system-stage-detail">
                {stage.detail}
              </text>
            </g>
          );
        })}

        <rect className="system-result" x="18" y="210" width="484" height="48" rx="2" />
        <text x="34" y="230" className="svg-meta">
          RESULT
        </text>
        <text x="34" y="247" className="system-result-copy">
          SOFTWARE THAT IS USEFUL, SECURE, AND BUILT TO LAST.
        </text>
        <text x="486" y="240" textAnchor="end" className="system-result-mark">
          ↗
        </text>
      </svg>
      <figcaption>{active ? active.detail : "From real constraints to dependable software."}</figcaption>
    </figure>
  );
}
