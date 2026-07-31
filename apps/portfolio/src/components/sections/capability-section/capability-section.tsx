import type { SkillCategory } from "@muneeb-systems/shared-types";
import type { VisibleProject } from "@/lib/portfolio-selectors";
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
        description="No percentages. Just categories, usage context, and related systems."
      />
      <CapabilityMap skills={skills} projects={projects} />
    </section>
  );
}
