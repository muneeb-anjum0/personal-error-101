import type { ExperienceEntry } from "@muneeb-systems/shared-types";

export function ExperienceCaseStudy({ entry, index }: { entry: ExperienceEntry; index: number }) {
  return (
    <article className="experience-case-study">
      <div className="experience-case-study-intro">
        <a className="back-link" href="/#experience">BACK TO EXPERIENCE</a>
        <header className="experience-case-study-header">
          <p className="technical-label">EXPERIENCE RECORD / {String(index + 1).padStart(2, "0")}</p>
          <h1>{entry.role}</h1>
          <p className="experience-case-study-organization">{entry.organization}</p>
          <p className="metadata">
            {entry.startDate} — {entry.endDate ?? "Present"} / {entry.location}
          </p>
        </header>
      </div>
      <div className="experience-case-study-grid">
        <ExperienceNarrative label="Role context" copy={entry.summary} />
        <ExperienceNarrative label="Primary challenge" copy={entry.challenge ?? "Challenge details pending."} />
        <ExperienceList label="Highlights" items={entry.highlights} />
        <ExperienceList label="Contributions" items={entry.contributions} />
        <ExperienceList label="Results" items={entry.results} />
        <section className="experience-case-study-stack">
          <p className="technical-label">WORKING STACK</p>
          <div className="inline-list">
            {entry.technologies.map((technology) => (
              <span key={technology}>{technology}</span>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}

function ExperienceNarrative({ label, copy }: { label: string; copy: string }) {
  return (
    <section>
      <p className="technical-label">{label}</p>
      <p>{copy}</p>
    </section>
  );
}

function ExperienceList({ label, items }: { label: string; items: string[] }) {
  return (
    <section className="experience-case-study-list">
      <p className="technical-label">{label}</p>
      <ol>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  );
}
