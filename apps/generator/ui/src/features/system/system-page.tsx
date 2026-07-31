import { KeyValueList } from "../../components/data-display/key-value-list";
import { ErrorState, LoadingState } from "../../components/feedback/states";
import { StatusIndicator } from "../../components/status/status-indicator";
import { useApiResource } from "../../hooks/use-api-resource";
import { generatorApiClient } from "../../services/api-client/api-client";

export function SystemPage() {
  const system = useApiResource((signal) => generatorApiClient.system(signal), []);

  if (system.loading && !system.data) {
    return <LoadingState label="Loading system information" />;
  }

  if (system.error && !system.data) {
    return <ErrorState message={system.error} onRetry={() => void system.refresh()} />;
  }

  const data = system.data;
  if (!data) return null;

  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">SYSTEM</p>
        <h1>Local Runtime Information</h1>
        <p>
          Safe process, filesystem, command, and model-path checks. No arbitrary commands are
          executed.
        </p>
      </header>
      <section className="two-column">
        <article className="panel">
          <h2>Runtime</h2>
          <KeyValueList
            items={[
              { label: "Application version", value: data.applicationVersion },
              { label: "Node.js", value: data.nodeVersion },
              { label: "OS", value: `${data.platform} / ${data.architecture}` },
              { label: "Uptime", value: `${Math.round(data.processUptimeSeconds)}s` },
              { label: "Started", value: data.serverStartedAt },
              {
                label: "Memory",
                value: `${Math.round(data.memoryUsage.heapUsed / 1024 / 1024)} MB heap used`
              }
            ]}
          />
        </article>
        <article className="panel">
          <h2>Capabilities</h2>
          <p>
            <StatusIndicator
              status={data.git.available ? "ready" : "unavailable"}
              label={`Git ${data.git.version ?? "Unavailable"}`}
            />
          </p>
          <p>
            <StatusIndicator
              status={data.docker.available ? "ready" : "unavailable"}
              label={`Docker ${data.docker.version ?? "Unavailable"}`}
            />
          </p>
          <p>
            <StatusIndicator
              status={data.modelPath.exists ? "ready" : "not-started"}
              label={data.modelPath.note}
            />
          </p>
        </article>
      </section>
      <article className="panel">
        <h2>Paths</h2>
        <KeyValueList
          items={[
            { label: "Repository root", value: data.repositoryRoot },
            { label: "Portfolio path", value: data.portfolioPath },
            { label: "Data directory", value: data.dataDirectory },
            { label: "Log directory", value: data.logDirectory },
            { label: "Model path", value: data.modelPath.configuredPath }
          ]}
        />
      </article>
    </section>
  );
}
