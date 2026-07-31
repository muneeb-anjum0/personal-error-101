import type { ReactNode } from "react";

interface SectionHeadingProps {
  label: string;
  eyebrow?: string;
  heading: ReactNode;
  description?: string;
  align?: "start" | "wide";
  action?: ReactNode;
}

export function SectionHeading({
  label,
  eyebrow,
  heading,
  description,
  align = "start",
  action
}: SectionHeadingProps) {
  return (
    <header className={`section-heading section-heading-${align}`}>
      <p className="section-label">{label}</p>
      <div>
        {eyebrow ? <p className="technical-label">{eyebrow}</p> : null}
        <h2>{heading}</h2>
        {description ? <p className="section-description">{description}</p> : null}
      </div>
      {action ? <div className="section-action">{action}</div> : null}
    </header>
  );
}
