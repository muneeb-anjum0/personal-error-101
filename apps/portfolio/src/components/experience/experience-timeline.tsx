"use client";

import { useState } from "react";
import type { ExperienceEntry } from "@muneeb-systems/shared-types";

interface ExperienceTimelineProps {
  entries: ExperienceEntry[];
}

export function ExperienceTimeline({ entries }: ExperienceTimelineProps) {
  const [selectedId, setSelectedId] = useState(entries[0]?.id ?? "");
  const selected = entries.find((entry) => entry.id === selectedId) ?? entries[0];

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
        <article className="experience-detail" role="tabpanel">
          <p className="technical-label">SELECTED ROLE</p>
          <h3>
            {selected.role} / {selected.organization}
          </h3>
          <p className="metadata">
            {selected.startDate} - {selected.endDate ?? "Present"} / {selected.location}
          </p>
          <p>{selected.summary}</p>
          <div className="detail-columns">
            <DetailBlock
              title="Challenge"
              items={[selected.challenge ?? "Challenge details pending."]}
            />
            <DetailBlock title="Contributions" items={selected.contributions} />
            <DetailBlock title="Results" items={selected.results} />
          </div>
          <div className="inline-list">
            {selected.technologies.map((technology) => (
              <span key={technology}>{technology}</span>
            ))}
          </div>
        </article>
      ) : null}
    </div>
  );
}

function DetailBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
