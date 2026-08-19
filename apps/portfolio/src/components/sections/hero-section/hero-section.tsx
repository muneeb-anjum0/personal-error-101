import type { Profile, Project } from "@muneeb-systems/shared-types";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { EngineeringSystem } from "@/components/visuals/engineering-system";
import { HeroTypewriter } from "./hero-typewriter";

interface HeroSectionProps {
  profile: Profile;
  resumeAvailable: boolean;
  projects: Project[];
}

export function HeroSection({ profile, resumeAvailable, projects }: HeroSectionProps) {
  const firstName = profile.name.split(" ")[0]?.toUpperCase() ?? profile.name.toUpperCase();
  const heroTitleLines = ["HELLO,", `I'M ${firstName}`];

  return (
    <section id="top" className="hero-section">
      <Reveal className="hero-copy hero-entrance" pattern="hero">
        <div className="hero-meta" data-hero-reveal>
          <span>[ {profile.role ?? "Engineer"} ]</span>
        </div>
        <p className="hero-greeting" data-hero-reveal>
          {profile.location.toUpperCase()}
        </p>
        <h1>
          <HeroTypewriter lines={heroTitleLines} />
        </h1>
        <div className="hero-actions" data-hero-reveal>
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
      <EngineeringSystem projects={projects} />
    </section>
  );
}
