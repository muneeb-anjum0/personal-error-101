import type { ContentBundle } from "@muneeb-systems/shared-types";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { getIdentityStats } from "@/lib/portfolio-selectors";

interface IdentitySectionProps {
  content: ContentBundle;
}

export function IdentitySection({ content }: IdentitySectionProps) {
  return (
    <section id="identity" className="portfolio-section identity-section">
      <SectionHeading
        label="01 / IDENTITY"
        heading={content.profile.identityHeading ?? "ENGINEERING PROFILE."}
      />
      <Reveal className="identity-grid" pattern="stagger">
        <p className="identity-statement">{content.profile.longBio}</p>
        <dl className="stats-grid">
          {getIdentityStats(content).map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}
