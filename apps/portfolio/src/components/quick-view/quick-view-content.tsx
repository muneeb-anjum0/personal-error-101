import type { ExperienceEntry, Profile, SkillCategory } from "@muneeb-systems/shared-types";
import type { VisibleProject } from "@/lib/portfolio-selectors";
import { Button } from "@/components/ui/button";
import { summarizeExperience } from "@/lib/portfolio-selectors";

interface QuickViewContentProps {
  profile: Profile;
  skills: SkillCategory[];
  projects: VisibleProject[];
  experience: ExperienceEntry[];
  resumeAvailable: boolean;
}

export function QuickViewContent({
  profile,
  skills,
  projects,
  experience,
  resumeAvailable
}: QuickViewContentProps) {
  return (
    <div className="quick-view-content">
      <div>
        <p className="technical-label">QUICK VIEW</p>
        <h2>{profile.name}</h2>
        <p>{profile.headline}</p>
      </div>
      <p>{profile.shortBio}</p>
      <section>
        <h3>Core skills</h3>
        {skills.length > 0 ? (
          <div className="inline-list">
            {skills.slice(0, 5).map((skill) => (
              <span key={skill.id}>{skill.name}</span>
            ))}
          </div>
        ) : (
          <p className="quick-view-empty">Add skills from the admin.</p>
        )}
      </section>
      <section>
        <h3>Featured systems</h3>
        {projects.length > 0 ? (
          <ol>
            {projects.map((project) => (
              <li key={project.id}>
                <a href={`/projects/${project.slug}`}>{project.name}</a>
              </li>
            ))}
          </ol>
        ) : (
          <p className="quick-view-empty">Add projects from the admin.</p>
        )}
      </section>
      <section>
        <h3>Experience</h3>
        <p>
          {experience.length > 0
            ? summarizeExperience(experience)
            : "Add experience from the admin."}
        </p>
      </section>
      <div className="quick-actions">
        <Button href={`mailto:${profile.email}`} variant="primary">
          Email
        </Button>
        <Button href={profile.githubUrl} variant="secondary">
          GitHub
        </Button>
        <Button href={profile.linkedInUrl} variant="secondary">
          LinkedIn
        </Button>
        {resumeAvailable ? (
          <Button href={profile.resumePath} variant="ghost">
            Resume
          </Button>
        ) : (
          <Button disabled variant="ghost">
            Resume pending
          </Button>
        )}
      </div>
    </div>
  );
}
