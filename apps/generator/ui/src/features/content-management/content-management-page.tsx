import { useEffect, useState } from "react";
import { ErrorState, LoadingState } from "../../components/feedback/states";
import { useToast } from "../../components/feedback/toast-provider";
import { useApiResource } from "../../hooks/use-api-resource";
import { toFriendlyError } from "../../services/api-client/api-error";
import { generatorApiClient } from "../../services/api-client/api-client";

export function ContentManagementPage({ type }: { type: string }) {
  const content = useApiResource(
    (signal) => generatorApiClient.stagedContent(type, signal),
    [type]
  );
  const status = useApiResource((signal) => generatorApiClient.stagedStatus(signal), []);
  const [text, setText] = useState("");
  const [dirty, setDirty] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    if (content.data) {
      setText(JSON.stringify(content.data, null, 2));
      setDirty(false);
    }
  }, [content.data]);

  async function save() {
    try {
      const parsed: unknown = JSON.parse(text);
      await generatorApiClient.updateStagedContent(type, parsed);
      notify(`${type.toUpperCase()} staged`);
      setDirty(false);
      await content.refresh();
      await status.refresh();
    } catch (error) {
      notify(toFriendlyError(error));
    }
  }

  if (content.loading && !content.data) {
    return <LoadingState label={`Loading staged ${type}`} />;
  }

  if (content.error && !content.data) {
    return <ErrorState message={content.error} onRetry={() => void content.refresh()} />;
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">STAGED CONTENT</p>
        <h1>
          {type[0]?.toUpperCase()}
          {type.slice(1)}
        </h1>
        <p>
          Edits are written to the private staged area only. Public portfolio JSON remains
          untouched.
        </p>
      </header>
      <div className="content-layout">
        <article className="panel editor-panel">
          <div className="toolbar">
            <button type="button" disabled={!dirty} onClick={() => void save()}>
              SAVE STAGED JSON
            </button>
            <button type="button" onClick={() => void content.refresh()}>
              RELOAD
            </button>
          </div>
          <textarea
            className="json-editor"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setDirty(true);
            }}
          />
        </article>
        <aside className="panel">
          <h2>Stage State</h2>
          <dl className="key-value-list">
            <div>
              <dt>Profile</dt>
              <dd>{status.data?.profile ? "STAGED" : "BASELINE"}</dd>
            </div>
            <div>
              <dt>Projects</dt>
              <dd>{status.data?.projects ?? 0}</dd>
            </div>
            <div>
              <dt>Experience</dt>
              <dd>{status.data?.experience ?? 0}</dd>
            </div>
            <div>
              <dt>Skills</dt>
              <dd>{status.data?.skills ?? 0}</dd>
            </div>
            <div>
              <dt>Activity</dt>
              <dd>{status.data?.activity ?? 0}</dd>
            </div>
            <div>
              <dt>Conflicts</dt>
              <dd>{status.data?.conflicts.join(", ") || "NONE"}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
