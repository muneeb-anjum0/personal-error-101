"use client";

import { useRouter } from "next/navigation";
import type { VisibleProject } from "@/lib/portfolio-selectors";
import { GeneratedProjectCover } from "@/components/visuals/generated-project-cover";
import { ProjectActions } from "./project-actions";
import { ProjectMetadata } from "./project-metadata";

interface ProjectPanelProps {
  project: VisibleProject;
  index: number;
}

export function ProjectPanel({ project, index }: ProjectPanelProps) {
  const router = useRouter();

  const openProject = () => router.push(`/projects/${project.slug}`);

  return (
    <article
      aria-label={`Open ${project.name}`}
      className="project-panel"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a, button")) return;
        openProject();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openProject();
        }
      }}
      role="link"
      tabIndex={0}
    >
      <div className="project-panel-copy">
        <div className="project-panel-top">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <ProjectMetadata project={project} />
        </div>
        <h3>{project.name}</h3>
        <ProjectActions project={project} />
      </div>
      <div className="project-cover-variant">
        <GeneratedProjectCover className="project-cover-desktop" index={index} project={project} />
        <GeneratedProjectCover className="project-cover-mobile" index={index} project={project} wide />
      </div>
    </article>
  );
}
