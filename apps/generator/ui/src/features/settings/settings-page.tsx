import { useEffect, useState } from "react";
import type { GeneratorSettingsUpdate } from "@muneeb-systems/shared-types";
import { ErrorState, LoadingState } from "../../components/feedback/states";
import { useToast } from "../../components/feedback/toast-provider";
import { useApiResource } from "../../hooks/use-api-resource";
import { generatorApiClient } from "../../services/api-client/api-client";
import { toFriendlyError } from "../../services/api-client/api-error";
import { SystemPage } from "../system/system-page";

type SettingsSection = "preferences" | "system";

const sections: Array<{ id: SettingsSection; label: string; description: string }> = [
  {
    id: "preferences",
    label: "General",
    description: "GitHub account and repository access"
  },
  {
    id: "system",
    label: "System information",
    description: "Runtime paths, versions, and readiness"
  }
];

export function SettingsPage() {
  const settings = useApiResource((signal) => generatorApiClient.settings(signal), []);
  const [form, setForm] = useState<GeneratorSettingsUpdate>({});
  const [saving, setSaving] = useState(false);
  const [openSection, setOpenSection] = useState<SettingsSection | null>("preferences");
  const { notify } = useToast();

  useEffect(() => {
    if (settings.data) {
      setForm(settings.data);
    }
  }, [settings.data]);

  if (settings.loading && !settings.data) {
    return <LoadingState label="Loading generator settings" />;
  }

  if (settings.error && !settings.data) {
    return <ErrorState message={settings.error} onRetry={() => void settings.refresh()} />;
  }

  async function save() {
    setSaving(true);
    try {
      const saved = await generatorApiClient.updateSettings(form);
      setForm(saved);
      notify("Settings saved. Backup created before replacement.");
    } catch (error) {
      notify(toFriendlyError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-stack settings-page">
      <header className="page-header">
        <p className="eyebrow">SETTINGS</p>
        <h1>Settings</h1>
        <p>Manage the local generator without exposing secrets or content-editing controls.</p>
      </header>
      <div className="settings-intro-strip" aria-label="Settings behavior">
        <span>
          <strong>02</strong> control groups
        </span>
        <span>
          <strong>01</strong> open at a time
        </span>
        <span>
          <strong>LOCAL</strong> configuration
        </span>
      </div>
      <div className="settings-accordion">
        {sections.map((section, index) => {
          const open = openSection === section.id;
          return (
            <section
              key={section.id}
              className={`settings-accordion-item${open ? " is-open" : ""}`}
            >
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`settings-panel-${section.id}`}
                onClick={() => setOpenSection(open ? null : section.id)}
              >
                <span className="settings-section-index">{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <strong>{section.label}</strong>
                  <small>{section.description}</small>
                </span>
                <span className="settings-section-state">
                  <small>{open ? "OPEN" : "CLOSED"}</small>
                  <b aria-hidden="true">{open ? "−" : "+"}</b>
                </span>
              </button>
              {open ? (
                <div id={`settings-panel-${section.id}`} className="settings-accordion-panel">
                  {section.id === "preferences" ? (
                    <PreferencesForm form={form} saving={saving} setForm={setForm} onSave={save} />
                  ) : null}
                  {section.id === "system" ? <SystemPage /> : null}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </section>
  );
}

function PreferencesForm({
  form,
  saving,
  setForm,
  onSave
}: {
  form: GeneratorSettingsUpdate;
  saving: boolean;
  setForm: (value: GeneratorSettingsUpdate) => void;
  onSave: () => Promise<void>;
}) {
  return (
    <form
      className="settings-form embedded-settings-form"
      onSubmit={(event) => event.preventDefault()}
    >
      <Field
        label="GitHub username"
        value={form.githubUsername}
        onChange={(value) => setForm({ ...form, githubUsername: value.trim() })}
      />
      <label className="checkbox-field">
        <input
          checked={Boolean(form.includePrivateRepositories)}
          type="checkbox"
          onChange={(event) =>
            setForm({ ...form, includePrivateRepositories: event.target.checked })
          }
        />
        Include private repositories during GitHub synchronization
      </label>
      <button
        className="primary-action"
        disabled={saving}
        type="button"
        onClick={() => void onSave()}
      >
        {saving ? "SAVING" : "SAVE SETTINGS"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
