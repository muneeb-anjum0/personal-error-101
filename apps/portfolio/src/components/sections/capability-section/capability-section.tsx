import type { SkillCategory } from "@muneeb-systems/shared-types";
import type { VisibleProject } from "@/lib/portfolio-selectors";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { CapabilityMap } from "@/components/skills/capability-map";

interface CapabilitySectionProps {
  skills: SkillCategory[];
  projects: VisibleProject[];
}

export function CapabilitySection({ skills, projects }: CapabilitySectionProps) {
  return (
    <section id="capabilities" className="portfolio-section capability-section">
      <SectionHeading
        label="02 / CAPABILITIES"
        heading="A STRUCTURED MAP OF THE ENGINEERING CORE."
        description="Editable skill categories and related projects."
      />
      {skills.length > 0 ? (
        <CapabilityMap skills={skills} projects={projects} />
      ) : (
        <EmptyState
          title="NO SKILLS YET."
          message="Add skill categories from the local admin when you are ready."
        />
      )}
    </section>
  );
}
