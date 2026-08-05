import { useState } from "react";
import type { ContentFileType } from "@muneeb-systems/shared-types";
import { ContentManagementPage } from "../content-management/content-management-page";

const templates: Array<{ type: ContentFileType; label: string; description: string }> = [
  {
    type: "profile",
    label: "Profile",
    description: "Identity, biography, contact, and homepage copy"
  },
  {
    type: "experience",
    label: "Experience",
    description: "Roles, organizations, highlights, and technologies"
  },
  { type: "skills", label: "Skills", description: "Skill groups and individual capabilities" }
];

export function ContentPage() {
  const [selected, setSelected] = useState<ContentFileType>("profile");

  return (
    <section className="page-stack content-workspace">
      <header className="page-header">
        <p className="eyebrow">CONTENT</p>
        <h1>Portfolio content</h1>
        <p>Choose a template, fill in the fields, and save. No JSON editing required.</p>
      </header>
      <div className="content-studio">
        <nav className="content-template-tabs" aria-label="Content templates">
          {templates.map((template, index) => (
            <button
              key={template.type}
              type="button"
              aria-pressed={selected === template.type}
              onClick={() => setSelected(template.type)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span>
                <strong>{template.label}</strong>
                <small>{template.description}</small>
              </span>
            </button>
          ))}
        </nav>
        <ContentManagementPage key={selected} type={selected} embedded />
      </div>
    </section>
  );
}
