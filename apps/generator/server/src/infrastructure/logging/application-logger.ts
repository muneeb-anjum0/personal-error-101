import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  LogCategory,
  LogEntry,
  LogLevel,
  LogQuery,
  LogsResponse
} from "@muneeb-systems/shared-types";

export class ApplicationLogger {
  private readonly entries: LogEntry[] = [];

  public constructor(private readonly logDirectory: string) {}

  public async log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, unknown>,
    requestId?: string
  ): Promise<LogEntry> {
    const entry: LogEntry = {
      id: `log_${randomUUID()}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata: metadata ? this.redact(metadata) : undefined,
      requestId
    };
    this.entries.unshift(entry);
    this.entries.splice(500);
    await this.write(entry);
    return entry;
  }

  public query(query: LogQuery): LogsResponse {
    const search = query.search?.toLowerCase();
    const filtered = this.entries
      .filter((entry) => !query.level || entry.level === query.level)
      .filter((entry) => !query.category || entry.category === query.category)
      .filter((entry) => !search || entry.message.toLowerCase().includes(search))
      .filter((entry) => !query.before || entry.timestamp < query.before);
    const ordered = query.order === "oldest" ? [...filtered].reverse() : filtered;
    const entries = ordered.slice(0, query.limit);
    return { entries, total: filtered.length, returned: entries.length };
  }

  private async write(entry: LogEntry): Promise<void> {
    await mkdir(this.logDirectory, { recursive: true });
    await appendFile(
      path.join(this.logDirectory, "generator.log"),
      `${JSON.stringify(entry)}\n`,
      "utf8"
    );
  }

  private redact(metadata: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(metadata).map(([key, value]) => [
        key,
        /token|secret|password|api.?key/i.test(key) ? "REDACTED" : value
      ])
    );
  }
}
