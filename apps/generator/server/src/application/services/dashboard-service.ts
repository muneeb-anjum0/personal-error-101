import type { DashboardOverview, ServiceStatus } from "@muneeb-systems/shared-types";
import type { GeneratorAppConfig } from "../../config/app-config.js";
import type { ContentStatusService } from "./content-status-service.js";
import type { LogQueryService } from "./log-query-service.js";
import type { SettingsService } from "./settings-service.js";
import type { GitHubService } from "./github-service.js";
import type { AiRuntimeService } from "./ai-runtime-service.js";
import type { ProcessingQueueService } from "./processing-queue-service.js";
import type { StagedContentService } from "./staged-content-service.js";

export class DashboardService {
  public constructor(
    private readonly config: GeneratorAppConfig,
    private readonly content: ContentStatusService,
    private readonly settings: SettingsService,
    private readonly logs: LogQueryService,
    private readonly github: GitHubService,
    private readonly ai: AiRuntimeService,
    private readonly queue: ProcessingQueueService,
    private readonly staged: StagedContentService
  ) {}

  public async getOverview(): Promise<DashboardOverview> {
    const [
      metrics,
      configuration,
      recentLogs,
      githubStatus,
      aiState,
      queueState,
      stagedState
    ] = await Promise.all([
      this.content.metrics(),
      this.settings.getSafeConfiguration(),
      this.logs.getLogs({ limit: 6, order: "newest" }).entries,
      this.github.getStatus(),
      this.ai.inspect(),
      this.queue.getQueue(),
      this.staged.status()
    ]);

    return {
      application: {
        name: "MUNEEB.SYSTEMS GENERATOR",
        version: this.config.version,
        phase: this.config.phase,
        uptimeSeconds: process.uptime(),
        timestamp: new Date().toISOString()
      },
      services: serviceStatuses(
        metrics.validationStatus,
        githubStatus.authenticationState,
        aiState.status,
        queueState.state
      ),
      metrics,
      configuration,
      recentLogs,
      futureWorkflow: [
        `FETCH REPOSITORIES: AVAILABLE / ${githubStatus.counts.total} STORED`,
        `SELECT REPOSITORIES: AVAILABLE / ${githubStatus.counts.selectedForProcessing} SELECTED`,
        `AI RUNTIME: ${aiState.status}`,
        `QUEUE PROCESSING: AVAILABLE / ${queueState.metrics.pending} PENDING / ${queueState.metrics.active} ACTIVE`,
        `GENERATED PROJECTS: ${queueState.metrics.completedDrafts} LIVE SUMMARIES`,
        `DIRECT CONTENT: ${stagedState.conflicts.length === 0 ? "READY" : "NEEDS ATTENTION"}`,
        `GITHUB RATE LIMIT: ${githubStatus.rateLimit.remaining}/${githubStatus.rateLimit.limit}`
      ]
    };
  }
}

function serviceStatuses(
  contentStatus: "valid" | "invalid",
  githubState: string,
  aiState: string,
  queueState: string
): ServiceStatus[] {
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
    {
      id: "ai",
      label: "Local AI",
      status: aiState.includes("READY")
        ? "ready"
        : aiState.includes("FAILED") || aiState.includes("INVALID")
          ? "invalid"
          : "not_started",
      required: false,
      message: aiState
    },
    {
      id: "queue",
      label: "Processing queue",
      status: queueState === "FAILED" ? "invalid" : "ready",
      required: false,
      message: queueState
    }
  ];
}
