import { useEffect, useState } from "react";
import { ErrorState, LoadingState } from "../../components/feedback/states";
import { useToast } from "../../components/feedback/toast-provider";
import { useApiResource } from "../../hooks/use-api-resource";
import { toFriendlyError } from "../../services/api-client/api-error";
import { generatorApiClient } from "../../services/api-client/api-client";

type ContentRecord = Record<string, unknown>;
type FieldKind = "text" | "textarea" | "date" | "url" | "email";
interface FieldDefinition {
  key: string;
  label: string;
  kind?: FieldKind;
  placeholder?: string;
}

const starter = { editable: true, note: "Edited with the portfolio content form." };

const profileFields: FieldDefinition[] = [
  { key: "name", label: "Name" },
  { key: "role", label: "Role" },
  { key: "headline", label: "Headline", kind: "textarea" },
  { key: "shortBio", label: "Short biography", kind: "textarea" },
  { key: "longBio", label: "Full biography", kind: "textarea" },
  { key: "identityHeading", label: "Identity heading" },
  { key: "projectsDescription", label: "Projects introduction", kind: "textarea" },
  { key: "philosophyHeading", label: "Philosophy heading" },
  { key: "location", label: "Location" },
  { key: "availability", label: "Availability" },
  { key: "email", label: "Email", kind: "email" },
  { key: "githubUrl", label: "GitHub URL", kind: "url" },
  { key: "linkedInUrl", label: "LinkedIn URL", kind: "url" },
  { key: "resumePath", label: "Resume path" }
];

const profileLists = [
  ["heroTitleLines", "Hero title lines"],
  ["projectsHeading", "Projects heading lines"],
  ["philosophyStatementLines", "Philosophy statement lines"],
  ["philosophyPrinciples", "Philosophy principles"]
] as const;

const collectionFields: Record<string, FieldDefinition[]> = {
  projects: [
    { key: "name", label: "Project name" },
    { key: "subtitle", label: "Subtitle" },
    { key: "summary", label: "Summary", kind: "textarea" },
    { key: "problem", label: "Problem", kind: "textarea" },
    { key: "solution", label: "Solution", kind: "textarea" },
    { key: "architecture", label: "Architecture", kind: "textarea" },
    { key: "impact", label: "Impact", kind: "textarea" },
    { key: "imagePath", label: "Image path" }
  ],
  experience: [
    { key: "role", label: "Role" },
    { key: "organization", label: "Organization" },
    { key: "location", label: "Location" },
    { key: "startDate", label: "Start date", kind: "date" },
    { key: "endDate", label: "End date", kind: "date" },
    { key: "summary", label: "Summary", kind: "textarea" },
    { key: "challenge", label: "Main challenge", kind: "textarea" }
  ],
  skills: [{ key: "name", label: "Category name" }]
};

const collectionLists: Record<string, Array<readonly [string, string]>> = {
  projects: [
    ["categories", "Categories"],
    ["technologies", "Technologies"],
    ["tags", "Tags"],
    ["keyFeatures", "Key features"],
    ["challenges", "Challenges"],
    ["technicalHighlights", "Technical highlights"]
  ],
  experience: [
    ["highlights", "Highlights"],
    ["contributions", "Contributions"],
    ["results", "Results"],
    ["technologies", "Technologies"]
  ],
  skills: [["skills", "Skills"]]
};

export function ContentManagementPage({
  type,
  embedded = false
}: {
  type: string;
  embedded?: boolean;
}) {
  const content = useApiResource(
    (signal) => generatorApiClient.stagedContent(type, signal),
    [type]
  );
  const [value, setValue] = useState<unknown>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    if (content.data !== undefined) {
      setValue(content.data);
      setDirty(false);
    }
  }, [content.data]);

  async function save(nextValue: unknown = value): Promise<boolean> {
    setSaving(true);
    try {
      const normalized = normalizeContent(type, nextValue);
      await generatorApiClient.updateStagedContent(type, normalized);
      setValue(normalized);
      notify(`${title(type)} saved.`);
      setDirty(false);
      await content.refresh();
      return true;
    } catch (error) {
      notify(toFriendlyError(error));
      return false;
    } finally {
      setSaving(false);
    }
  }

  if (content.loading && content.data === undefined)
    return <LoadingState label={`Loading ${type}`} />;
  if (content.error && content.data === undefined) {
    return <ErrorState message={content.error} onRetry={() => void content.refresh()} />;
  }

  const profile = asRecord(value);
  const records = asRecords(value);

  return (
    <section className="page-stack content-template-editor">
      {!embedded ? (
        <header className="page-header">
          <p className="eyebrow">CONTENT TEMPLATE</p>
          <h1>{title(type)}</h1>
          <p>Fill in the fields below. Technical storage details stay hidden.</p>
        </header>
      ) : null}

      <div className="content-form-heading">
        <div>
          <p className="eyebrow">
            {type === "profile" ? "YOUR DETAILS" : `${records.length} ENTRIES`}
          </p>
          <h2>{type === "profile" ? "Profile template" : `${title(type)} template`}</h2>
        </div>
        {type === "profile" ? (
          <button
            className="primary-action"
            type="button"
            disabled={!dirty || saving}
            onClick={() => void save()}
          >
            {saving ? "SAVING…" : "SAVE CHANGES"}
          </button>
        ) : null}
      </div>

      {type === "profile" ? (
        <ProfileForm
          value={profile}
          onChange={(next) => {
            setValue(next);
            setDirty(true);
          }}
        />
      ) : (
        <CollectionForm
          type={type}
          records={records}
          saving={saving}
          onChange={(next) => {
            setValue(next);
            setDirty(true);
          }}
          onPersist={save}
        />
      )}
    </section>
  );
}

function ProfileForm({
  value,
  onChange
}: {
  value: ContentRecord;
  onChange: (value: ContentRecord) => void;
}) {
  const sections = [
    {
      id: "identity",
      label: "Identity",
      description: "The first impression across your portfolio.",
      keys: ["name", "role", "headline", "shortBio"]
    },
    {
      id: "story",
      label: "Full story",
      description: "Long-form context about your work and point of view.",
      keys: ["longBio", "identityHeading", "philosophyHeading"]
    },
    {
      id: "contact",
      label: "Contact",
      description: "Your location, availability, and ways to connect.",
      keys: ["location", "availability", "email", "githubUrl", "linkedInUrl", "resumePath"]
    },
    {
      id: "homepage",
      label: "Homepage",
      description: "Section headings and supporting homepage copy.",
      keys: ["projectsDescription"]
    }
  ];
  const [activeSection, setActiveSection] = useState(sections[0]!.id);
  const section = sections.find((item) => item.id === activeSection) ?? sections[0]!;
  return (
    <div className="profile-editor">
      <nav className="profile-section-tabs" aria-label="Profile field groups">
        {sections.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={activeSection === item.id}
            onClick={() => setActiveSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="content-form-card" key={section.id}>
        <header className="profile-form-intro">
          <span>{String(sections.indexOf(section) + 1).padStart(2, "0")}</span>
          <div>
            <h3>{section.label}</h3>
            <p>{section.description}</p>
          </div>
        </header>
        <div className="content-field-grid">
          {profileFields
            .filter((field) => section.keys.includes(field.key))
            .map((field) => (
              <FormField
                key={field.key}
                field={field}
                value={text(value[field.key])}
                onChange={(next) => onChange({ ...value, [field.key]: next })}
              />
            ))}
        </div>
        {section.id === "homepage" ? (
          <div className="content-field-grid">
            {profileLists.map(([key, label]) => (
              <ListField
                key={key}
                label={label}
                value={strings(value[key])}
                onChange={(next) => onChange({ ...value, [key]: next })}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CollectionForm({
  type,
  records,
  saving,
  onChange,
  onPersist
}: {
  type: string;
  records: ContentRecord[];
  saving: boolean;
  onChange: (records: ContentRecord[]) => void;
  onPersist: (records: ContentRecord[]) => Promise<boolean>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  function addRecord() {
    const record = emptyRecord(type);
    onChange([...records, record]);
    setEditingId(text(record.id));
  }

  async function saveRecord() {
    if (await onPersist(records)) setEditingId(null);
  }

  async function deleteRecord(index: number) {
    const next = records.filter((_, itemIndex) => itemIndex !== index);
    if (await onPersist(next)) {
      onChange(next);
      setEditingId(null);
    }
  }

  return (
    <div className={`content-record-list content-record-list-${type}`}>
      <button className="content-add-button" type="button" onClick={addRecord}>
        + ADD {singular(type).toUpperCase()}
      </button>
      {records.map((record, index) => {
        const recordId = text(record.id) || String(index);
        const editing = editingId === recordId;
        return (
          <article
            className={`content-entry-card content-entry-${type}${editing ? " is-editing" : ""}`}
            data-index={String(index + 1).padStart(2, "0")}
            key={recordId}
          >
            <header className="content-record-header">
              <div>
                <p className="eyebrow">
                  {singular(type).toUpperCase()} {index + 1}
                </p>
                <h3>{recordTitle(type, record)}</h3>
                {!editing ? <RecordPreview type={type} record={record} /> : null}
              </div>
              <div className="content-card-actions">
                <button type="button" onClick={() => setEditingId(editing ? null : recordId)}>
                  {editing ? "CLOSE" : "VIEW / EDIT"}
                </button>
                <button
                  className="danger-text-button"
                  type="button"
                  disabled={saving}
                  onClick={() => void deleteRecord(index)}
                >
                  DELETE
                </button>
              </div>
            </header>
            {editing ? (
              <div className="content-entry-editor">
                <div className="content-field-grid">
                  {(collectionFields[type] ?? []).map((field) => (
                    <FormField
                      key={field.key}
                      field={field}
                      value={text(record[field.key])}
                      onChange={(next) =>
                        replace(
                          records,
                          index,
                          {
                            ...record,
                            [field.key]: field.key === "endDate" && !next ? null : next
                          },
                          onChange
                        )
                      }
                    />
                  ))}
                  {type === "projects" ? (
                    <>
                      <SelectField
                        label="Status"
                        value={text(record.status) || "active"}
                        options={["active", "draft", "archived"]}
                        onChange={(next) =>
                          replace(records, index, { ...record, status: next }, onChange)
                        }
                      />
                      <CheckField
                        label="Feature this project"
                        checked={Boolean(record.featured)}
                        onChange={(next) =>
                          replace(records, index, { ...record, featured: next }, onChange)
                        }
                      />
                      <CheckField
                        label="Hide from portfolio"
                        checked={Boolean(record.hidden)}
                        onChange={(next) =>
                          replace(records, index, { ...record, hidden: next }, onChange)
                        }
                      />
                    </>
                  ) : null}
                </div>
                <div className="content-field-grid">
                  {(collectionLists[type] ?? []).map(([key, label]) => (
                    <ListField
                      key={key}
                      label={label}
                      value={strings(record[key])}
                      onChange={(next) =>
                        replace(records, index, { ...record, [key]: next }, onChange)
                      }
                    />
                  ))}
                </div>
                {type === "projects" ? (
                  <LinksField
                    links={asRecords(record.links)}
                    onChange={(links) => replace(records, index, { ...record, links }, onChange)}
                  />
                ) : null}
                <footer className="content-editor-footer">
                  <p>
                    Complete the required fields, then save this card to publish it to the
                    portfolio.
                  </p>
                  <button
                    className="primary-action"
                    type="button"
                    disabled={saving}
                    onClick={() => void saveRecord()}
                  >
                    {saving ? "SAVING…" : `SAVE ${singular(type).toUpperCase()}`}
                  </button>
                </footer>
              </div>
            ) : null}
          </article>
        );
      })}
      {records.length === 0 ? (
        <p className="content-empty-state">
          Nothing here yet. Use the button above to add your first {singular(type)}.
        </p>
      ) : null}
    </div>
  );
}

function RecordPreview({ type, record }: { type: string; record: ContentRecord }) {
  const items =
    type === "skills"
      ? strings(record.skills)
      : type === "experience"
        ? strings(record.technologies)
        : [];
  const previewLimit = type === "skills" ? 4 : 6;
  return (
    <div className="content-card-preview">
      <p className="content-entry-summary">{recordSummary(type, record)}</p>
      {type === "experience" && text(record.summary) ? (
        <p className="content-preview-copy">{text(record.summary)}</p>
      ) : null}
      {items.length ? (
        <div className="content-preview-tags">
          {items.slice(0, previewLimit).map((item) => (
            <span key={item}>{item}</span>
          ))}
          {items.length > previewLimit ? <span>+{items.length - previewLimit}</span> : null}
        </div>
      ) : null}
      {type === "experience" ? (
        <div className="content-preview-counts">
          <span>{strings(record.highlights).length} highlights</span>
          <span>{strings(record.results).length} results</span>
        </div>
      ) : null}
    </div>
  );
}

function FormField({
  field,
  value,
  onChange
}: {
  field: FieldDefinition;
  value: string;
  onChange: (value: string) => void;
}) {
  const kind = field.kind ?? "text";
  return (
    <label className={kind === "textarea" ? "content-field is-wide" : "content-field"}>
      <span>{field.label}</span>
      {kind === "textarea" ? (
        <textarea
          value={value}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          type={kind}
          value={value}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function ListField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <FormField
      field={{ key: label, label: `${label} (one per line)`, kind: "textarea" }}
      value={value.join("\n")}
      onChange={(next) =>
        onChange(
          next
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      }
    />
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="content-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {title(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="content-check-field">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function LinksField({
  links,
  onChange
}: {
  links: ContentRecord[];
  onChange: (links: ContentRecord[]) => void;
}) {
  return (
    <section className="content-nested-section">
      <header>
        <h4>Project links</h4>
        <button
          type="button"
          onClick={() => onChange([...links, { label: "Website", url: "https://" }])}
        >
          + ADD LINK
        </button>
      </header>
      {links.map((link, index) => (
        <div className="content-link-row" key={index}>
          <input
            aria-label="Link label"
            value={text(link.label)}
            placeholder="GitHub"
            onChange={(event) =>
              replace(links, index, { ...link, label: event.target.value }, onChange)
            }
          />
          <input
            aria-label="Link URL"
            type="url"
            value={text(link.url)}
            placeholder="https://…"
            onChange={(event) =>
              replace(links, index, { ...link, url: event.target.value }, onChange)
            }
          />
          <button
            type="button"
            onClick={() => onChange(links.filter((_, itemIndex) => itemIndex !== index))}
          >
            REMOVE
          </button>
        </div>
      ))}
    </section>
  );
}

function emptyRecord(type: string): ContentRecord {
  const id = `${singular(type)}_${crypto.randomUUID()}`;
  if (type === "projects")
    return {
      id,
      name: "",
      summary: "",
      status: "active",
      hidden: false,
      categories: [],
      technologies: [],
      tags: [],
      links: [],
      featured: false,
      keyFeatures: [],
      challenges: [],
      technicalHighlights: [],
      relatedSkillIds: [],
      starter
    };
  if (type === "experience")
    return {
      id,
      role: "",
      organization: "",
      location: "",
      startDate: "",
      endDate: null,
      summary: "",
      highlights: [],
      contributions: [],
      results: [],
      technologies: [],
      relatedProjectIds: [],
      starter
    };
  return { id, name: "", skills: [], starter };
}

function replace(
  records: ContentRecord[],
  index: number,
  value: ContentRecord,
  onChange: (records: ContentRecord[]) => void
) {
  onChange(records.map((record, itemIndex) => (itemIndex === index ? value : record)));
}
function asRecord(value: unknown): ContentRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ContentRecord)
    : {};
}
function asRecords(value: unknown): ContentRecord[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}
function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function title(value: string): string {
  return value === "draft" ? "Unpublished" : `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
function singular(type: string): string {
  return type === "projects"
    ? "project"
    : type === "skills"
      ? "skill category"
      : "experience";
}
function recordTitle(type: string, record: ContentRecord): string {
  return text(record.name) || text(record.title) || text(record.role) || `New ${singular(type)}`;
}
function recordSummary(type: string, record: ContentRecord): string {
  if (type === "experience")
    return (
      [text(record.organization), text(record.location), dateRange(record)]
        .filter(Boolean)
        .join(" · ") || "Open this card to add the role details."
    );
  if (type === "skills")
    return `${strings(record.skills).length} ${strings(record.skills).length === 1 ? "skill" : "skills"}`;
  return "Open this card to add the details.";
}
function dateRange(record: ContentRecord): string {
  return [text(record.startDate), text(record.endDate) || "Present"].filter(Boolean).join(" — ");
}
function normalizeContent(type: string, value: unknown): unknown {
  if (type === "profile") return value;
  return asRecords(value).map((record) => {
    const next = { ...record };
    const optionalFields = type === "experience" ? ["challenge"] : [];
    for (const key of optionalFields) if (!text(next[key]).trim()) delete next[key];
    if (type === "experience" && !text(next.endDate).trim()) next.endDate = null;
    return next;
  });
}
