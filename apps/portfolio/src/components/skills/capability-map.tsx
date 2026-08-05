"use client";

import { useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { SkillCategory } from "@muneeb-systems/shared-types";
import type { VisibleProject } from "@/lib/portfolio-selectors";
import { getCapabilityUsage } from "@/lib/portfolio-selectors";

interface CapabilityMapProps {
  skills: SkillCategory[];
  projects: VisibleProject[];
}

export function CapabilityMap({ skills, projects }: CapabilityMapProps) {
  const [selectedId, setSelectedId] = useState(skills[0]?.id ?? "");
  const selected = skills.find((skill) => skill.id === selectedId) ?? skills[0];
  const usage = selected ? getCapabilityUsage(selected, projects) : undefined;

  return (
    <div className="capability-map">
      <div className="capability-core">ENGINEERING CORE</div>
      <div className="capability-nodes" role="group" aria-label="Capability categories">
        {skills.map((skill, index) => (
          <button
            key={skill.id}
            aria-pressed={skill.id === selected?.id}
            className="capability-node"
            style={{ "--node-index": index } as CSSProperties}
            type="button"
            onClick={() => setSelectedId(skill.id)}
          >
            {skill.name}
          </button>
        ))}
      </div>
      {usage ? (
        <AnimatePresence mode="wait">
          <motion.aside
            key={usage.skill.id}
            className="capability-detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
          >
            <header className="capability-detail-header">
              <div>
                <p className="technical-label">SELECTED DISCIPLINE</p>
                <h3>{usage.skill.name}</h3>
              </div>
              <span>{String(usage.skill.skills.length).padStart(2, "0")}</span>
            </header>
            <div className="capability-skill-grid" aria-label={`${usage.skill.name} skills`}>
              {usage.skill.skills.map((skill, index) => (
                <span key={skill}>
                  <small>{String(index + 1).padStart(2, "0")}</small>
                  {skill}
                </span>
              ))}
            </div>
            {usage.projectCount > 0 ? (
              <footer className="capability-projects">
                <p className="technical-label">
                  USED IN {usage.projectCount} SYSTEM{usage.projectCount === 1 ? "" : "S"}
                </p>
                <div className="inline-list">
                  {usage.relatedProjects.map((project) => (
                    <span key={project.id}>{project.name}</span>
                  ))}
                </div>
              </footer>
            ) : null}
          </motion.aside>
        </AnimatePresence>
      ) : null}
    </div>
  );
}
