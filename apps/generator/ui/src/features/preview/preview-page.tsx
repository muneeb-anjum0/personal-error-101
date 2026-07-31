import { useState } from "react";
import { ErrorState, LoadingState } from "../../components/feedback/states";
import { useToast } from "../../components/feedback/toast-provider";
import { useApiResource } from "../../hooks/use-api-resource";
import { toFriendlyError } from "../../services/api-client/api-error";
import { generatorApiClient } from "../../services/api-client/api-client";

export function PreviewPage() {
  const sessions = useApiResource((signal) => generatorApiClient.previewSessions(signal), []);
  const [selected, setSelected] = useState("");
  const data = useApiResource(
    (signal) =>
      selected ? generatorApiClient.previewData(selected, signal) : Promise.resolve(null),
    [selected]
  );
  const { notify } = useToast();

  async function createPreview() {
    try {
      const session = await generatorApiClient.createPreviewSession();
      setSelected(session.id);
      notify("Preview session created");
      await sessions.refresh();
    } catch (error) {
      notify(toFriendlyError(error));
    }
  }

  if (sessions.loading && !sessions.data) {
    return <LoadingState label="Loading preview sessions" />;
  }

  if (sessions.error && !sessions.data) {
    return <ErrorState message={sessions.error} onRetry={() => void sessions.refresh()} />;
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">PREVIEW</p>
        <h1>Portfolio Preview</h1>
        <p>Create an expiring preview bundle from staged content for manual inspection.</p>
      </header>
      <div className="content-layout">
        <div className="panel file-list">
          <button type="button" onClick={() => void createPreview()}>
            <span>CREATE PREVIEW SESSION</span>
            <small>USES STAGED CONTENT</small>
          </button>
          {sessions.data?.items.map((session) => (
            <button
              key={session.id}
              aria-pressed={session.id === selected}
              type="button"
              onClick={() => setSelected(session.id)}
            >
              <span>{session.id}</span>
              <small>
                {session.status} / EXPIRES {session.expiresAt}
              </small>
            </button>
          ))}
        </div>
        <article className="panel">
          <h2>Session Data</h2>
          {data.loading ? <LoadingState label="Loading preview data" /> : null}
          {data.error ? (
            <ErrorState message={data.error} onRetry={() => void data.refresh()} />
          ) : null}
          {data.data ? (
            <pre className="json-viewer">{JSON.stringify(data.data, null, 2)}</pre>
          ) : (
            <p className="muted">NO SESSION SELECTED</p>
          )}
        </article>
      </div>
    </section>
  );
}
