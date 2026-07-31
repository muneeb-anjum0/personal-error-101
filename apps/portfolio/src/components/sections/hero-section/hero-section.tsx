import type { Profile } from "@muneeb-systems/shared-types";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { EngineeringSystem } from "@/components/visuals/engineering-system";

interface HeroSectionProps {
  profile: Profile;
  resumeAvailable: boolean;
}

export function HeroSection({ profile, resumeAvailable }: HeroSectionProps) {
  const firstName = profile.name.split(" ")[0]?.toUpperCase() ?? profile.name.toUpperCase();
  const heroTitleLines =
    profile.heroTitleLines.length > 0 ? profile.heroTitleLines : ["I BUILD", "USEFUL", "SYSTEMS."];

  return (
    <section id="top" className="hero-section">
      <Reveal className="hero-copy hero-entrance" pattern="stagger">
        <div className="hero-meta">
          <span>[ {profile.role ?? "Engineer"} ]</span>
          <StatusIndicator label="System status" value={profile.availability} />
          <span>{profile.location.toUpperCase()}</span>
        </div>
        <p className="hero-greeting">HELLO, I&apos;M {firstName}.</p>
        <h1>
          {heroTitleLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <p className="hero-support">{profile.headline}</p>
        <div className="hero-actions">
          <Button href="#projects" variant="primary" size="large">
            EXPLORE MY SYSTEM
          </Button>
          {resumeAvailable ? (
            <Button href={profile.resumePath} variant="secondary" size="large">
              DOWNLOAD RESUME
            </Button>
          ) : (
            <Button disabled variant="secondary" size="large">
              RESUME PENDING
            </Button>
          )}
        </div>
      </Reveal>
      <EngineeringSystem />
    </section>
  );
}
