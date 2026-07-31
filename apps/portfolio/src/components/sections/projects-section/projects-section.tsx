import type { VisibleProject } from "@/lib/portfolio-selectors";
import type { Profile } from "@muneeb-systems/shared-types";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProjectList } from "@/components/projects/project-list";

export function ProjectsSection({
  projects,
  profile
}: {
  projects: VisibleProject[];
  profile: Profile;
}) {
  const headingLines = profile.projectsHeading.length > 0 ? profile.projectsHeading : ["PROJECTS."];

  return (
    <section id="projects" className="portfolio-section projects-section">
      <SectionHeading
        label="04 / SELECTED SYSTEMS"
        heading={headingLines.map((line) => (
          <span key={line}>
            {line}
            <br />
          </span>
        ))}
        description={profile.projectsDescription}
      />
      <ProjectList projects={projects} />
    </section>
  );
}
