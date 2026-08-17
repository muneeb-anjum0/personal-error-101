import type { Profile, Project } from "@muneeb-systems/shared-types";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { EngineeringSystem } from "@/components/visuals/engineering-system";

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
      <Reveal className="hero-copy hero-entrance" pattern="stagger">
        <div className="hero-meta">
          <span>[ {profile.role ?? "Engineer"} ]</span>
        </div>
        <p className="hero-greeting">{profile.location.toUpperCase()}</p>
        <h1>
          {heroTitleLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
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
      <EngineeringSystem projects={projects} />
    </section>
  );
}
