"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { VisibleProject } from "@/lib/portfolio-selectors";
import { filterProjects, projectFilters } from "@/lib/portfolio-selectors";
import { panelVariants } from "@/lib/animation/motion-variants";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectFilter } from "./project-filter";
import { ProjectPanel } from "./project-panel";

export function ProjectList({ projects }: { projects: VisibleProject[] }) {
  const [filter, setFilter] = useState("Featured");
  const visible = useMemo(() => filterProjects(projects, filter), [filter, projects]);

  if (projects.length === 0) {
    return (
      <EmptyState
        title="NO PROJECTS YET."
        message="Add project records from the local admin when you are ready."
      />
    );
  }

  return (
    <div className="project-list-wrap">
      <ProjectFilter activeFilter={filter} filters={projectFilters} onChange={setFilter} />
      {visible.length > 0 ? (
        <motion.div className="project-list" layout>
          <AnimatePresence mode="popLayout">
            {visible.map((project, index) => (
              <motion.div
                key={project.id}
                layout
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={panelVariants}
              >
                <ProjectPanel index={index} project={project} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState title="NO SYSTEMS MATCH THIS FILTER." message="SELECT ANOTHER CATEGORY." />
      )}
    </div>
  );
}
