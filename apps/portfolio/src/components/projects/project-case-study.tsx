import type { VisibleProject } from "@/lib/portfolio-selectors";
import { GeneratedProjectCover } from "@/components/visuals/generated-project-cover";
import { ProjectActions } from "./project-actions";
import { formatDisplayDate } from "@/lib/portfolio-selectors";

interface ProjectCaseStudyProps {
  project: VisibleProject;
  previous?: VisibleProject;
  next?: VisibleProject;
}

export function ProjectCaseStudy({ project, previous, next }: ProjectCaseStudyProps) {
  return (
    <article className="case-study">
      <a className="back-link" href="/#projects">
        BACK TO PROJECTS
      </a>
      <header className="case-study-hero">
        <div>
          <p className="technical-label">SYSTEM CASE STUDY</p>
          <h1>{project.name}</h1>
          {project.subtitle ? <p>{project.subtitle}</p> : null}
          <p className="metadata">
            CREATED {formatDisplayDate(project.createdAt)} / UPDATED{" "}
            {formatDisplayDate(project.pushedAt ?? project.updatedAt)}
          </p>
          <ProjectActions project={project} />
        </div>
        <GeneratedProjectCover index={0} project={project} />
      </header>
      <div className="case-study-grid">
        <CaseBlock title="Introduction" body={project.summary} />
        <CaseBlock title="Problem" body={project.problem} />
        <CaseBlock title="Solution" body={project.solution} />
        <CaseBlock title="Architecture" body={project.architecture} />
        <CaseList title="Key features" items={project.keyFeatures} />
        <CaseList title="Engineering challenges" items={project.challenges} />
        <CaseList title="Technical highlights" items={project.technicalHighlights} />
        <CaseBlock title="Impact summary" body={project.impact} />
        <CaseList title="Technologies" items={project.technologies} />
      </div>
      <nav className="case-study-nav" aria-label="Adjacent projects">
        {previous ? (
          <a href={`/projects/${previous.slug}`}>PREVIOUS / {previous.name}</a>
        ) : (
          <span />
        )}
        {next ? <a href={`/projects/${next.slug}`}>NEXT / {next.name}</a> : <span />}
      </nav>
    </article>
  );
}

function CaseBlock({ title, body }: { title: string; body?: string }) {
  if (!body) {
    return null;
  }

  return (
    <section>
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  );
}

function CaseList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
