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
      <header className="case-study-masthead">
        <div className="case-study-strip">
          <a className="back-link" href="/#projects">
            ← ALL PROJECTS
          </a>
          <span>PROJECT FILE / {project.slug.toUpperCase()}</span>
        </div>
        <div className="case-study-hero">
          <div className="case-study-visual">
            <GeneratedProjectCover index={0} project={project} />
            <div className="case-study-visual-ledger">
              <span>STACK / {String(project.technologies.length).padStart(2, "0")} TOOLS</span>
              <span>STATUS / DOCUMENTED</span>
            </div>
          </div>
        <div className="case-study-summary">
          <p className="technical-label">SYSTEM CASE STUDY</p>
          <h1>{project.name}</h1>
          {project.subtitle ? <p>{project.subtitle}</p> : null}
          <p className="metadata">
            CREATED {formatDisplayDate(project.createdAt)} / UPDATED{" "}
            {formatDisplayDate(project.pushedAt ?? project.updatedAt)}
          </p>
          <ProjectActions context="detail" project={project} />
        </div>
        </div>
      </header>
      <div className="case-study-story">
        <div className="case-study-frame">
          <CaseBlock className="case-study-introduction" title="Introduction" body={project.summary} />
          <CaseBlock className="case-study-problem" title="Problem" body={project.problem} />
        </div>
        <div className="case-study-response">
          <CaseBlock className="case-study-solution" title="Solution" body={project.solution} />
          <CaseBlock className="case-study-architecture" title="Architecture" body={project.architecture} />
        </div>
        <div className="case-study-evidence">
          <CaseList title="Key features" items={project.keyFeatures} />
          <CaseList title="Engineering challenges" items={project.challenges} />
          <CaseList title="Technical highlights" items={project.technicalHighlights} />
        </div>
        <CaseBlock className="case-study-impact" title="Impact summary" body={project.impact} />
      </div>
      <TechnologyMatrix technologies={project.technologies} />
      <nav className="case-study-nav" aria-label="Adjacent projects">
        {previous ? (
          <a className="case-study-nav-previous" href={`/projects/${previous.slug}`}>
            ← PREVIOUS
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a className="case-study-nav-next" href={`/projects/${next.slug}`}>
            NEXT →
          </a>
        ) : <span />}
      </nav>
    </article>
  );
}

function CaseBlock({ className, title, body }: { className?: string; title: string; body?: string }) {
  if (!body) return null;

  return (
    <section className={className}>
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  );
}

function CaseList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

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

function TechnologyMatrix({ technologies }: { technologies: string[] }) {
  if (technologies.length === 0) return null;

  return (
    <section className="technology-matrix">
      <header>
        <div>
          <p className="technical-label">SYSTEM COMPONENTS</p>
          <h2>Technology stack</h2>
        </div>
        <span>{String(technologies.length).padStart(2, "0")} TOOLS</span>
      </header>
      <div className="technology-matrix-grid">
        {technologies.map((technology, index) => (
          <div key={technology}>
            <small>{String(index + 1).padStart(2, "0")}</small>
            <strong>{technology}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
