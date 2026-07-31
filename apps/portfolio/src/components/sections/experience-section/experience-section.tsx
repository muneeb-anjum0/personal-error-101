import type { ExperienceEntry } from "@muneeb-systems/shared-types";
import { SectionHeading } from "@/components/ui/section-heading";
import { ExperienceTimeline } from "@/components/experience/experience-timeline";

export function ExperienceSection({ entries }: { entries: ExperienceEntry[] }) {
  return (
    <section id="experience" className="portfolio-section experience-section">
      <SectionHeading label="03 / EXPERIENCE" heading="ROLES, SYSTEMS, AND RESPONSIBILITY." />
      <ExperienceTimeline entries={entries} />
    </section>
  );
}
