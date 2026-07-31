import { useState } from "react";
import type { ContentFileType } from "@muneeb-systems/shared-types";
import { ErrorState, LoadingState } from "../../components/feedback/states";
import { StatusIndicator } from "../../components/status/status-indicator";
import { useApiResource } from "../../hooks/use-api-resource";
import { generatorApiClient } from "../../services/api-client/api-client";

const defaultType: ContentFileType = "projects";

export function ContentPage() {
  const [selected, setSelected] = useState<ContentFileType>(defaultType);
  const status = useApiResource((signal) => generatorApiClient.contentStatus(signal), []);
  const detail = useApiResource(
    (signal) => generatorApiClient.contentDetail(selected, signal),
    [selected]
  );

  if (status.loading && !status.data) {
    return <LoadingState label="Inspecting static content" />;
  }

  if (status.error && !status.data) {
    return <ErrorState message={status.error} onRetry={() => void status.refresh()} />;
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">CONTENT</p>
        <h1>Static Content Inspection</h1>
        <p>
          Read-only validation and JSON inspection for the files consumed by the public portfolio.
        </p>
      </header>
      <div className="content-layout">
        <div className="panel file-list">
          {status.data?.files.map((file) => (
            <button
              key={file.type}
              aria-pressed={selected === file.type}
              type="button"
              onClick={() => setSelected(file.type)}
            >
              <span>{file.label}</span>
              <StatusIndicator status={file.status} label={file.status.toUpperCase()} />
              <small>
                {file.relativePath} / {file.recordCount} records
              </small>
            </button>
          ))}
        </div>
        <article className="panel json-panel">
          {detail.loading ? <LoadingState label="Loading selected content" /> : null}
          {detail.error ? (
            <ErrorState message={detail.error} onRetry={() => void detail.refresh()} />
          ) : null}
          {detail.data ? (
            <>
              <h2>{detail.data.file.label}</h2>
              <p className="muted">
                {detail.data.file.relativePath} / {detail.data.file.sizeBytes} bytes / modified{" "}
                {detail.data.file.modifiedAt ?? "unknown"}
              </p>
              {detail.data.file.issues.length > 0 ? (
                <ul className="issue-list">
                  {detail.data.file.issues.map((issue) => (
                    <li key={`${issue.path}-${issue.message}`}>
                      {issue.severity.toUpperCase()} / {issue.path} / {issue.message}
                    </li>
                  ))}
                </ul>
              ) : null}
              <pre className="json-viewer">{JSON.stringify(detail.data.json, null, 2)}</pre>
            </>
          ) : null}
        </article>
      </div>
    </section>
  );
}
