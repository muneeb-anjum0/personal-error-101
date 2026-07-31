import type { Profile } from "@muneeb-systems/shared-types";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { EngineeringSystem } from "@/components/visuals/engineering-system";

interface HeroSectionProps {
  profile: Profile;
  resumeAvailable: boolean;
}

export function HeroSection({ profile, resumeAvailable }: HeroSectionProps) {
  return (
    <section id="top" className="hero-section">
      <div className="hero-copy">
        <div className="hero-meta">
          <span>[ FULL-STACK ENGINEER ]</span>
          <StatusIndicator label="System status" value={profile.availability} />
          <span>{profile.location.toUpperCase()}</span>
        </div>
        <p className="hero-greeting">HELLO, I&apos;M MUNEEB.</p>
        <h1>
          I BUILD
          <br />
          SYSTEMS THAT
          <br />
          THINK.
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
      </div>
      <EngineeringSystem />
    </section>
  );
}
