import { useEffect, useState } from "react";
import type { GeneratorSettingsUpdate } from "@muneeb-systems/shared-types";
import { ErrorState, LoadingState } from "../../components/feedback/states";
import { useToast } from "../../components/feedback/toast-provider";
import { useApiResource } from "../../hooks/use-api-resource";
import { generatorApiClient } from "../../services/api-client/api-client";
import { toFriendlyError } from "../../services/api-client/api-error";

export function SettingsPage() {
  const settings = useApiResource((signal) => generatorApiClient.settings(signal), []);
  const [form, setForm] = useState<GeneratorSettingsUpdate>({});
  const [saving, setSaving] = useState(false);
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
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">SETTINGS</p>
        <h1>Safe Local Preferences</h1>
        <p>
          Secrets are not stored here. Restart-required fields are labelled and persisted
          atomically.
        </p>
      </header>
      <form className="settings-form" onSubmit={(event) => event.preventDefault()}>
        <Field
          label="GitHub username"
          value={form.githubUsername}
          onChange={(value) => setForm({ ...form, githubUsername: value.trim() })}
        />
        <Field
          label="Portfolio repository path"
          value={form.portfolioRepositoryPath}
          onChange={(value) => setForm({ ...form, portfolioRepositoryPath: value })}
        />
        <Field
          label="Data directory / restart required"
          value={form.dataDirectory}
          onChange={(value) => setForm({ ...form, dataDirectory: value })}
        />
        <Field
          label="Model path"
          value={form.modelPath}
          onChange={(value) => setForm({ ...form, modelPath: value })}
        />
        <Field
          label="Model name"
          value={form.modelName}
          onChange={(value) => setForm({ ...form, modelName: value })}
        />
        <Field
          label="Model base URL"
          value={form.modelBaseUrl}
          onChange={(value) => setForm({ ...form, modelBaseUrl: value })}
        />
        <label className="checkbox-field">
          <input
            checked={Boolean(form.includePrivateRepositories)}
            type="checkbox"
            onChange={(event) =>
              setForm({ ...form, includePrivateRepositories: event.target.checked })
            }
          />
          Include private repositories when Phase 4 GitHub sync exists
        </label>
        <button
          className="primary-action"
          disabled={saving}
          type="button"
          onClick={() => void save()}
        >
          {saving ? "SAVING" : "SAVE SETTINGS"}
        </button>
      </form>
    </section>
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
