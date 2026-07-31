import type { Project } from "@muneeb-systems/shared-types";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate } from "@/lib/portfolio-selectors";

export function ProjectMetadata({ project }: { project: Project }) {
  return (
    <div className="project-metadata">
      <span>UPDATED {formatDisplayDate(project.pushedAt ?? project.updatedAt)}</span>
      <div className="badge-row">
        {project.categories.map((category) => (
          <Badge key={category}>{category}</Badge>
        ))}
      </div>
    </div>
  );
}
