import type { ExperienceEntry } from "@muneeb-systems/shared-types";
import { SectionHeading } from "@/components/ui/section-heading";
import { ExperienceTimeline } from "@/components/experience/experience-timeline";

export function ExperienceSection({ entries }: { entries: ExperienceEntry[] }) {
  return (
    <section id="experience" className="portfolio-section experience-section">
      <SectionHeading label="03 / EXPERIENCE" heading="WORK THAT SHIPS, LEARNS, AND LASTS." />
      <ExperienceTimeline entries={entries} />
    </section>
  );
}
