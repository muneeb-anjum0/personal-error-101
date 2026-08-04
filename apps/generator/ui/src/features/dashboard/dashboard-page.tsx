import { KeyValueList } from "../../components/data-display/key-value-list";
import { ErrorState, LoadingState } from "../../components/feedback/states";
import { StatusIndicator } from "../../components/status/status-indicator";
import { useApiResource } from "../../hooks/use-api-resource";
import { generatorApiClient } from "../../services/api-client/api-client";

export function DashboardPage() {
  const overview = useApiResource((signal) => generatorApiClient.dashboard(signal), []);
  const [detailView, setDetailView] = useState<"configuration" | "workflow" | "events" | null>(
    null
  );

  if (overview.loading && !overview.data) {
    return <LoadingState label="Loading dashboard overview" />;
  }

  if (overview.error && !overview.data) {
    return (
      <ErrorState
        message={`GENERATOR API OFFLINE / ${overview.error}`}
        onRetry={() => void overview.refresh()}
      />
    );
  }

  const data = overview.data;
  if (!data) {
    return null;
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">OVERVIEW</p>
        <h1>Control center</h1>
        <p>Sync repositories, generate project summaries, and manage live portfolio content.</p>
      </header>
      <article className="panel dashboard-summary">
        <div className="dashboard-services">
          {data.services.map((service) => (
            <div key={service.id} className="dashboard-service">
              <span>
                <strong>{service.label}</strong>
                <small>{service.required ? "CORE" : "OPTIONAL"}</small>
              </span>
              <StatusIndicator status={service.status} label={service.message} />
            </div>
          ))}
        </div>
        <div className="dashboard-metrics" aria-label="Content metrics">
          <span>
            <strong>{data.metrics.visibleProjects}</strong> Visible
          </span>
          <span>
            <strong>{data.metrics.hiddenProjects}</strong> Hidden
          </span>
          <span>
            <strong>{data.metrics.featuredProjects}</strong> Featured
          </span>
          <span>
            <strong>{data.metrics.experienceEntries}</strong> Experience
          </span>
          <span>
            <strong>{data.metrics.skillCategories}</strong> Skills
          </span>
          <span>
            <strong>{data.metrics.activityEntries}</strong> Activity
          </span>
        </div>
      </article>
      <section className={`horizontal-disclosure${detailView ? " is-open" : ""}`}>
        <nav aria-label="Overview details">
          <button
            type="button"
            aria-pressed={detailView === "configuration"}
            onClick={() => setDetailView(detailView === "configuration" ? null : "configuration")}
          >
            Configuration <span>{data.configuration.fields.length}</span>
          </button>
          <button
            type="button"
            aria-pressed={detailView === "workflow"}
            onClick={() => setDetailView(detailView === "workflow" ? null : "workflow")}
          >
            Workflow <span>{data.futureWorkflow.length}</span>
          </button>
          <button
            type="button"
            aria-pressed={detailView === "events"}
            onClick={() => setDetailView(detailView === "events" ? null : "events")}
          >
            Recent events <span>{data.recentLogs.length}</span>
          </button>
        </nav>
        {detailView ? (
          <article className="panel horizontal-disclosure-panel">
            {detailView === "configuration" ? (
              <KeyValueList
                items={data.configuration.fields.map((field) => ({
                  label: `${field.label} / ${field.source}`,
                  value: field.secret ? "REDACTED" : field.value
                }))}
              />
            ) : null}
            {detailView === "workflow" ? (
              <>
                <ol className="pipeline">
                  {data.futureWorkflow.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p className="muted">
                  Changes stay local and update the portfolio directly.
                </p>
              </>
            ) : null}
            {detailView === "events" ? (
              <div className="log-list compact">
                {data.recentLogs.map((entry) => (
                  <p key={entry.id}>
                    <span>{entry.timestamp}</span> {entry.level} / {entry.category} /{" "}
                    {entry.message}
                  </p>
                ))}
              </div>
            ) : null}
          </article>
        ) : null}
      </section>
    </section>
  );
}
import { useState } from "react";
