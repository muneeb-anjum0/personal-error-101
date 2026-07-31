import type { VisibleProject } from "@/lib/portfolio-selectors";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProjectList } from "@/components/projects/project-list";

export function ProjectsSection({ projects }: { projects: VisibleProject[] }) {
  return (
    <section id="projects" className="portfolio-section projects-section">
      <SectionHeading
        label="04 / SELECTED SYSTEMS"
        heading={
          <>
            PROJECTS GENERATED FROM
            <br />
            REAL SOURCE CODE.
          </>
        }
        description="Static project records are sorted by latest push date and rendered as large editorial system panels."
      />
      <ProjectList projects={projects} />
    </section>
  );
}
