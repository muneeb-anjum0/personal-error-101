import { useEffect, useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../../components/feedback/states";
import { useApiResource } from "../../hooks/use-api-resource";
import { generatorApiClient } from "../../services/api-client/api-client";

export function LogsPage() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: "100" });
    if (search) params.set("search", search);
    if (level) params.set("level", level);
    return `?${params.toString()}`;
  }, [level, search]);
  const logs = useApiResource((signal) => generatorApiClient.logs(query, signal), [query]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = window.setInterval(() => {
      if (!document.hidden) void logs.refresh();
    }, 7000);
    return () => window.clearInterval(interval);
  }, [autoRefresh, logs.refresh]);

  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">LOGS</p>
        <h1>Structured Application Logs</h1>
      </header>
      <div className="toolbar">
        <input
          aria-label="Search logs"
          placeholder="Search logs"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter log level"
          value={level}
          onChange={(event) => setLevel(event.target.value)}
        >
          <option value="">ALL LEVELS</option>
          <option value="DEBUG">DEBUG</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
        </select>
        <button type="button" onClick={() => void logs.refresh()}>
          REFRESH
        </button>
        <label className="checkbox-field inline">
          <input
            checked={autoRefresh}
            type="checkbox"
            onChange={(event) => setAutoRefresh(event.target.checked)}
          />
          Auto-refresh
        </label>
      </div>
      {logs.loading && !logs.data ? <LoadingState label="Loading logs" /> : null}
      {logs.error ? <ErrorState message={logs.error} onRetry={() => void logs.refresh()} /> : null}
      {logs.data?.entries.length === 0 ? (
        <EmptyState message="No log entries match the current filters." />
      ) : null}
      <div className="log-list">
        {logs.data?.entries.map((entry) => (
          <details key={entry.id} className="log-entry">
            <summary>
              <span>{entry.timestamp}</span>
              <strong>{entry.level}</strong>
              <span>{entry.category}</span>
              <span>{entry.message}</span>
            </summary>
            <pre>{JSON.stringify(entry.metadata ?? {}, null, 2)}</pre>
          </details>
        ))}
      </div>
    </section>
  );
}
