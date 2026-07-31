import type { DashboardOverview, ServiceStatus } from "@muneeb-systems/shared-types";
import type { GeneratorAppConfig } from "../../config/app-config.js";
import type { ContentStatusService } from "./content-status-service.js";
import type { LogQueryService } from "./log-query-service.js";
import type { SettingsService } from "./settings-service.js";
import type { GitHubService } from "./github-service.js";

export class DashboardService {
  public constructor(
    private readonly config: GeneratorAppConfig,
    private readonly content: ContentStatusService,
    private readonly settings: SettingsService,
    private readonly logs: LogQueryService,
    private readonly github: GitHubService
  ) {}

  public async getOverview(): Promise<DashboardOverview> {
    const [metrics, configuration, recentLogs, githubStatus] = await Promise.all([
      this.content.metrics(),
      this.settings.getSafeConfiguration(),
      this.logs.getLogs({ limit: 6, order: "newest" }).entries,
      this.github.getStatus()
    ]);

    return {
      application: {
        name: "MUNEEB.SYSTEMS GENERATOR",
        version: this.config.version,
        phase: this.config.phase,
        uptimeSeconds: process.uptime(),
        timestamp: new Date().toISOString()
      },
      services: serviceStatuses(metrics.validationStatus, githubStatus.authenticationState),
      metrics,
      configuration,
      recentLogs,
      futureWorkflow: [
        `FETCH REPOSITORIES: AVAILABLE / ${githubStatus.counts.total} STORED`,
        `SELECT REPOSITORIES: AVAILABLE / ${githubStatus.counts.selectedForProcessing} SELECTED`,
        `GITHUB RATE LIMIT: ${githubStatus.rateLimit.remaining}/${githubStatus.rateLimit.limit}`,
        "QUEUE PROCESSING: FUTURE",
        "GENERATE CONTENT: FUTURE",
        "REVIEW AND EDIT: FUTURE",
        "PUBLISH STATIC DATA: FUTURE"
      ]
    };
  }
}

function serviceStatuses(contentStatus: "valid" | "invalid", githubState: string): ServiceStatus[] {
  return [
    { id: "api", label: "Generator API", status: "ready", required: true, message: "Ready" },
    { id: "filesystem", label: "Filesystem", status: "ready", required: true, message: "Ready" },
    {
      id: "content",
      label: "Static Content",
      status: contentStatus,
      required: true,
      message: contentStatus === "valid" ? "Valid" : "Invalid"
    },
    {
      id: "github",
      label: "GitHub integration",
      status: githubState === "AUTHENTICATION_FAILED" ? "invalid" : "ready",
      required: false,
      message: githubState
    },
    { id: "ai", label: "Local AI", status: "not_started", required: false, message: "Not started" },
    {
      id: "publishing",
      label: "Publishing",
      status: "unavailable",
      required: false,
      message: "Unavailable"
    }
  ];
}
