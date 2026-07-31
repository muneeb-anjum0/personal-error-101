import type { Project } from "@muneeb-systems/shared-types";
import { Button } from "@/components/ui/button";

interface ProjectActionsProps {
  project: Project & { slug: string };
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const githubLink = project.links.find((link) => /github/i.test(link.label));
  const liveLink = project.links.find((link) => /live|demo/i.test(link.label));

  return (
    <div className="project-actions">
      <Button href={`/projects/${project.slug}`} variant="primary">
        VIEW SYSTEM
      </Button>
      {githubLink ? (
        <Button href={githubLink.url} variant="ghost">
          SOURCE CODE
        </Button>
      ) : null}
      {liveLink ? (
        <Button href={liveLink.url} variant="ghost">
          LIVE DEMO
        </Button>
      ) : null}
    </div>
  );
}
