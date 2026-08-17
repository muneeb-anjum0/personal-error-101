import type { Profile } from "@muneeb-systems/shared-types";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { getContactLinks } from "@/lib/portfolio-selectors";

interface ContactSectionProps {
  profile: Profile;
  resumeAvailable: boolean;
}

export function ContactSection({ profile, resumeAvailable }: ContactSectionProps) {
  return (
    <section id="contact" className="portfolio-section contact-section">
      <SectionHeading label="07 / CONTACT" heading="LET'S MAKE THE NEXT THING COUNT." />
      <Reveal className="contact-grid" pattern="stagger">
        <p>
          LET&apos;S TURN A GOOD IDEA
          <br />
          INTO USEFUL SOFTWARE.
        </p>
        <div className="contact-actions">
          {getContactLinks(profile).map((link, index) => (
            <Button
              key={link.href}
              href={link.href}
              variant={index === 0 ? "primary" : "secondary"}
              size="large"
            >
              {link.label}
            </Button>
          ))}
          {resumeAvailable ? (
            <Button href={profile.resumePath} variant="ghost" size="large">
              Download Resume
            </Button>
          ) : (
            <Button disabled variant="ghost" size="large">
              Resume pending
            </Button>
          )}
        </div>
      </Reveal>
      <div className="contact-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}
