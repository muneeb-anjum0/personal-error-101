import type { ActivityItem } from "@muneeb-systems/shared-types";
import { Reveal } from "@/components/motion/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { formatDisplayDate, sortActivityNewestFirst } from "@/lib/portfolio-selectors";

export function ActivitySection({ activity }: { activity: ActivityItem[] }) {
  const sorted = sortActivityNewestFirst(activity);

  return (
    <section id="activity" className="portfolio-section activity-section">
      <SectionHeading
        label="05 / ACTIVITY"
        eyebrow="LATEST ENGINEERING ACTIVITY"
        heading="A STATIC STREAM OF WORK."
      />
      {sorted.length > 0 ? (
        <Reveal className="activity-stream" pattern="stagger">
          {sorted.map((item) => (
            <article key={item.id}>
              <time dateTime={item.occurredAt}>{formatDisplayDate(item.occurredAt)}</time>
              <div>
                <p className="technical-label">
                  {item.repository ?? item.projectId ?? item.source}
                </p>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </Reveal>
      ) : (
        <EmptyState title="NO ACTIVITY LOADED." message="STATIC ACTIVITY DATA IS EMPTY." />
      )}
    </section>
  );
}
