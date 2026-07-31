import { logQuerySchema } from "@muneeb-systems/shared-schemas";
import type { LogsResponse } from "@muneeb-systems/shared-types";
import type { ApplicationLogger } from "../../infrastructure/logging/application-logger.js";

export class LogQueryService {
  public constructor(private readonly logger: ApplicationLogger) {}

  public getLogs(query: unknown): LogsResponse {
    return this.logger.query(logQuerySchema.parse(query));
  }
}
