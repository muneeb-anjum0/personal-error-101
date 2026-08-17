import type { ExperienceEntry } from "@muneeb-systems/shared-types";
import { EmptyState } from "@/components/ui/empty-state";

interface ExperienceTimelineProps {
  entries: ExperienceEntry[];
}

export function ExperienceTimeline({ entries }: ExperienceTimelineProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="NO EXPERIENCE YET."
        message="Add experience records from the local admin when you are ready."
      />
    );
  }

  return (
    <div className="experience-archive" aria-label="Professional experience">
      {entries.map((entry, index) => (
        <article className="experience-record" key={entry.id}>
          <a className="experience-record-trigger" href={`/experience/${entry.id}`}>
            <span className="experience-record-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="experience-record-role">
              <strong>{entry.role}</strong>
              <small>{entry.organization}</small>
            </span>
            <span className="experience-record-period">
              {entry.startDate} — {entry.endDate ?? "Present"}
            </span>
            <span className="experience-record-state" aria-hidden="true">
              View role <i>↗</i>
            </span>
          </a>
        </article>
      ))}
    </div>
  );
}
