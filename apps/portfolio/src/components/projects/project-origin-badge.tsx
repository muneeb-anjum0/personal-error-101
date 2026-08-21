import type { Project } from "@muneeb-systems/shared-types";

export function ProjectOriginBadge({ project }: { project: Project }) {
  if (!project.id.startsWith("generated_")) return null;

  return (
    <span className="project-origin-badge" title="This project case study was generated from repository material by the local AI workflow.">
      <span aria-hidden="true" />
      AI-GENERATED CASE STUDY
    </span>
  );
}
