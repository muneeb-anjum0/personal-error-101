"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ExperienceEntry } from "@muneeb-systems/shared-types";
import { EmptyState } from "@/components/ui/empty-state";

interface ExperienceTimelineProps {
  entries: ExperienceEntry[];
}

export function ExperienceTimeline({ entries }: ExperienceTimelineProps) {
  const [selectedId, setSelectedId] = useState(entries[0]?.id ?? "");
  const selected = entries.find((entry) => entry.id === selectedId) ?? entries[0];

  if (entries.length === 0) {
    return (
      <EmptyState
        title="NO EXPERIENCE YET."
        message="Add experience records from the local admin when you are ready."
      />
    );
  }

  return (
    <div className="experience-timeline">
      <div className="timeline-markers" role="tablist" aria-label="Experience timeline">
        {entries.map((entry) => (
          <button
            key={entry.id}
            aria-selected={entry.id === selected?.id}
            className="timeline-marker"
            role="tab"
            type="button"
            onClick={() => setSelectedId(entry.id)}
          >
            <span>{entry.organization}</span>
            <small>{entry.startDate}</small>
          </button>
        ))}
      </div>
      {selected ? (
        <AnimatePresence mode="wait">
          <motion.article
            key={selected.id}
            className="experience-detail"
            role="tabpanel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
          >
            <p className="technical-label">SELECTED ROLE</p>
            <h3>
              {selected.role} / {selected.organization}
            </h3>
            <p className="metadata">
              {selected.startDate} - {selected.endDate ?? "Present"} / {selected.location}
            </p>
            <p>{selected.summary}</p>
            <div className="detail-columns">
              <DetailNarrative
                title="Challenge"
                copy={selected.challenge ?? "Challenge details pending."}
              />
              <DetailBlock title="Highlights" items={selected.highlights} />
              <DetailBlock title="Contributions" items={selected.contributions} />
              <DetailBlock title="Results" items={selected.results} />
            </div>
            <div className="experience-accordions">
              <ExperienceAccordion
                title="Challenge"
                items={[selected.challenge ?? "Challenge details pending."]}
                ordered={false}
              />
              <ExperienceAccordion title="Highlights" items={selected.highlights} />
              <ExperienceAccordion title="Contributions" items={selected.contributions} />
              <ExperienceAccordion title="Results" items={selected.results} />
            </div>
            <div className="inline-list">
              {selected.technologies.map((technology) => (
                <span key={technology}>{technology}</span>
              ))}
            </div>
          </motion.article>
        </AnimatePresence>
      ) : null}
    </div>
  );
}

function ExperienceAccordion({
  title,
  items,
  ordered = true
}: {
  title: string;
  items: string[];
  ordered?: boolean;
}) {
  return (
    <details>
      <summary>
        {title}
        <span aria-hidden="true">+</span>
      </summary>
      {ordered ? (
        <ol>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      ) : (
        <p>{items.join(" ")}</p>
      )}
    </details>
  );
}

function DetailBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h4>{title}</h4>
      <ol>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  );
}

function DetailNarrative({ title, copy }: { title: string; copy: string }) {
  return (
    <section>
      <h4>{title}</h4>
      <p>{copy}</p>
    </section>
  );
}
