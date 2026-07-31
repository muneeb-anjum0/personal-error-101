"use client";

import { useMemo, useState } from "react";
import type { VisibleProject } from "@/lib/portfolio-selectors";
import { filterProjects, projectFilters } from "@/lib/portfolio-selectors";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectFilter } from "./project-filter";
import { ProjectPanel } from "./project-panel";

export function ProjectList({ projects }: { projects: VisibleProject[] }) {
  const [filter, setFilter] = useState("Featured");
  const visible = useMemo(() => filterProjects(projects, filter), [filter, projects]);

  return (
    <div className="project-list-wrap">
      <ProjectFilter activeFilter={filter} filters={projectFilters} onChange={setFilter} />
      {visible.length > 0 ? (
        <div className="project-list">
          {visible.map((project, index) => (
            <ProjectPanel key={project.id} index={index} project={project} />
          ))}
        </div>
      ) : (
        <EmptyState title="NO SYSTEMS MATCH THIS FILTER." message="SELECT ANOTHER CATEGORY." />
      )}
    </div>
  );
}
