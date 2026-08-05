import { useState } from "react";
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
        </div>
      </article>
      <section className="overview-explorer">
        <nav aria-label="Overview details">
          <button
            type="button"
            aria-pressed={detailView === "configuration"}
            onClick={() => setDetailView(detailView === "configuration" ? null : "configuration")}
          >
            <span>
              <small>01</small> Configuration
            </span>
            <strong>{data.configuration.fields.length}</strong>
          </button>
          <button
            type="button"
            aria-pressed={detailView === "workflow"}
            onClick={() => setDetailView(detailView === "workflow" ? null : "workflow")}
          >
            <span>
              <small>02</small> Workflow
            </span>
            <strong>{data.futureWorkflow.length}</strong>
          </button>
          <button
            type="button"
            aria-pressed={detailView === "events"}
            onClick={() => setDetailView(detailView === "events" ? null : "events")}
          >
            <span>
              <small>03</small> Recent events
            </span>
            <strong>{data.recentLogs.length}</strong>
          </button>
        </nav>
        <article className="overview-detail" key={detailView ?? "empty"}>
          {!detailView ? (
            <div className="overview-detail-empty">
              <span>01 — 03</span>
              <h2>Explore the workspace</h2>
              <p>
                Choose a view from the rail to inspect configuration, workflow, or recent events.
              </p>
            </div>
          ) : null}
          {detailView ? (
            <>
              {detailView === "configuration" ? (
                <>
                  <OverviewDetailHeader
                    index="01"
                    title="Runtime configuration"
                    copy="A readable snapshot of where this workspace gets its active settings."
                  />
                  <div className="configuration-grid">
                    {data.configuration.fields.map((field) => (
                      <div key={field.key}>
                        <small>{field.source}</small>
                        <strong>{field.label}</strong>
                        <span>{field.secret ? "Protected value" : field.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
              {detailView === "workflow" ? (
                <>
                  <OverviewDetailHeader
                    index="02"
                    title="Generation workflow"
                    copy="The short path from a selected repository to a live portfolio case study."
                  />
                  <ol className="overview-pipeline">
                    {data.futureWorkflow.map((step) => (
                      <li key={step}>
                        <span>
                          {String(data.futureWorkflow.indexOf(step) + 1).padStart(2, "0")}
                        </span>
                        <p>{step}</p>
                      </li>
                    ))}
                  </ol>
                </>
              ) : null}
              {detailView === "events" ? (
                <>
                  <OverviewDetailHeader
                    index="03"
                    title="Recent local events"
                    copy="A compact timeline of what the generator has done in this session."
                  />
                  <div className="overview-event-list">
                    {data.recentLogs.map((entry) => (
                      <article key={entry.id}>
                        <span>{entry.level}</span>
                        <div>
                          <strong>{entry.message}</strong>
                          <small>
                            {entry.category} · {new Date(entry.timestamp).toLocaleString()}
                          </small>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ) : null}
            </>
          ) : null}
        </article>
      </section>
    </section>
  );
}

function OverviewDetailHeader({
  index,
  title,
  copy
}: {
  index: string;
  title: string;
  copy: string;
}) {
  return (
    <header className="overview-detail-header">
      <span>{index}</span>
      <div>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
    </header>
  );
}
