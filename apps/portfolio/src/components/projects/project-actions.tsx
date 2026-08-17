import type { Project } from "@muneeb-systems/shared-types";
import { Button } from "@/components/ui/button";

interface ProjectActionsProps {
  project: Project & { slug: string };
  context?: "listing" | "detail";
}

export function ProjectActions({ project, context = "listing" }: ProjectActionsProps) {
  const githubLink = project.links.find((link) => /github/i.test(link.label));
  const liveLink = project.links.find((link) => /live|demo/i.test(link.label));

  return (
    <div className="project-actions">
      {githubLink ? (
        <Button href={githubLink.url} variant="primary">
          SOURCE CODE
        </Button>
      ) : null}
      {context === "listing" && liveLink ? (
        <Button href={liveLink.url} variant="ghost">
          LIVE DEMO
        </Button>
      ) : null}
    </div>
  );
}
