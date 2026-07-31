import type { LogQueryService } from "../../application/services/log-query-service.js";

export function getLogs(service: LogQueryService, query: unknown) {
  return service.getLogs(query);
}
