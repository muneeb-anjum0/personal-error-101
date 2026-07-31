import type { VisibleProject } from "@/lib/portfolio-selectors";
import { GeneratedProjectCover } from "@/components/visuals/generated-project-cover";
import { ProjectActions } from "./project-actions";
import { ProjectMetadata } from "./project-metadata";

interface ProjectPanelProps {
  project: VisibleProject;
  index: number;
}

export function ProjectPanel({ project, index }: ProjectPanelProps) {
  return (
    <article className="project-panel">
      <div className="project-panel-copy">
        <div className="project-panel-top">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <ProjectMetadata project={project} />
        </div>
        <h3>{project.name}</h3>
        {project.subtitle ? <p className="project-subtitle">{project.subtitle}</p> : null}
        <p>{project.summary}</p>
        <div className="inline-list">
          {project.technologies.map((technology) => (
            <span key={technology}>{technology}</span>
          ))}
        </div>
        <ProjectActions project={project} />
      </div>
      <GeneratedProjectCover index={index} project={project} />
    </article>
  );
}
