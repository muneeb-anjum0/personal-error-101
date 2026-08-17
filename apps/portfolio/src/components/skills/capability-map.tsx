"use client";

import { useState } from "react";
import type { SkillCategory } from "@muneeb-systems/shared-types";
import type { VisibleProject } from "@/lib/portfolio-selectors";
import { getCapabilityUsage } from "@/lib/portfolio-selectors";

interface CapabilityMapProps {
  skills: SkillCategory[];
  projects: VisibleProject[];
}

export function CapabilityMap({ skills, projects }: CapabilityMapProps) {
  const [selectedId, setSelectedId] = useState("");
  const selected = skills.find((skill) => skill.id === selectedId);
  const usage = selected ? getCapabilityUsage(selected, projects) : undefined;

  return (
    <section className="capability-index" aria-label="Engineering disciplines">
      <div className="capability-index-grid" role="tablist" aria-label="Engineering disciplines">
        {skills.map((skill) => {
          const isSelected = skill.id === selectedId;

          return (
            <button
              key={skill.id}
              aria-selected={isSelected}
              className="capability-index-card"
              onClick={() => setSelectedId((current) => (current === skill.id ? "" : skill.id))}
              role="tab"
              type="button"
            >
              <strong>{skill.name}</strong>
              <i aria-hidden="true">↗</i>
            </button>
          );
        })}
      </div>

      {usage ? (
        <section className="capability-index-drawer" role="tabpanel">
          <header>
            <div>
              <p className="technical-label">OPEN DISCIPLINE</p>
              <h3>{usage.skill.name}</h3>
            </div>
            <p>{String(usage.skill.skills.length).padStart(2, "0")} / SKILL SET</p>
          </header>
          <div className="capability-index-skills" aria-label={`${usage.skill.name} skills`}>
            {usage.skill.skills.map((skill, index) => (
              <span key={skill}>
                <i>{String(index + 1).padStart(2, "0")}</i>
                {skill}
              </span>
            ))}
          </div>
          {usage.projectCount > 0 ? (
            <footer>
              <p className="technical-label">RELATED SYSTEMS</p>
              <div className="inline-list">
                {usage.relatedProjects.map((project) => (
                  <span key={project.id}>{project.name}</span>
                ))}
              </div>
            </footer>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
