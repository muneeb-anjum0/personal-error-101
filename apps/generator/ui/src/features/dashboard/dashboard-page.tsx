import { MetricCard } from "../../components/data-display/metric-card";
import { KeyValueList } from "../../components/data-display/key-value-list";
import { ErrorState, LoadingState } from "../../components/feedback/states";
import { StatusIndicator } from "../../components/status/status-indicator";
import { useApiResource } from "../../hooks/use-api-resource";
import { generatorApiClient } from "../../services/api-client/api-client";

export function DashboardPage() {
  const overview = useApiResource((signal) => generatorApiClient.dashboard(signal), []);

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
        <h1>{data.application.name}</h1>
        <p>
          Local management foundation for static portfolio content. Future integrations are visible
          but inactive.
        </p>
      </header>
      <div className="status-grid">
        {data.services.map((service) => (
          <article key={service.id} className="panel">
            <p className="eyebrow">{service.label}</p>
            <StatusIndicator status={service.status} label={service.message} />
            <small>{service.required ? "Required core service" : "Later phase capability"}</small>
          </article>
        ))}
      </div>
      <div className="metric-grid">
        <MetricCard label="Visible projects" value={data.metrics.visibleProjects} />
        <MetricCard label="Hidden projects" value={data.metrics.hiddenProjects} />
        <MetricCard label="Featured projects" value={data.metrics.featuredProjects} />
        <MetricCard label="Experience entries" value={data.metrics.experienceEntries} />
        <MetricCard label="Skill categories" value={data.metrics.skillCategories} />
        <MetricCard label="Activity entries" value={data.metrics.activityEntries} />
      </div>
      <section className="two-column">
        <article className="panel">
          <h2>Configuration Summary</h2>
          <KeyValueList
            items={data.configuration.fields.map((field) => ({
              label: `${field.label} / ${field.source}`,
              value: field.secret ? "REDACTED" : field.value
            }))}
          />
        </article>
        <article className="panel">
          <h2>Future Workflow Preview</h2>
          <ol className="pipeline">
            {data.futureWorkflow.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="muted">
            Planned only. No GitHub sync, AI generation, queue, approval, or publishing runs in
            Phase 3.
          </p>
        </article>
      </section>
      <article className="panel">
        <h2>Recent Local Events</h2>
        <div className="log-list compact">
          {data.recentLogs.map((entry) => (
            <p key={entry.id}>
              <span>{entry.timestamp}</span> {entry.level} / {entry.category} / {entry.message}
            </p>
          ))}
        </div>
      </article>
    </section>
  );
}
