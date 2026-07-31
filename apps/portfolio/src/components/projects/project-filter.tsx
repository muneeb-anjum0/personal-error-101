"use client";

interface ProjectFilterProps {
  filters: string[];
  activeFilter: string;
  onChange: (filter: string) => void;
}

export function ProjectFilter({ filters, activeFilter, onChange }: ProjectFilterProps) {
  return (
    <div className="project-filter" aria-label="Project filters">
      {filters.map((filter) => (
        <button
          key={filter}
          aria-pressed={activeFilter === filter}
          type="button"
          onClick={() => onChange(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
