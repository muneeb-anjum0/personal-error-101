import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { ProcessingQueue, QueueEvent, QueueMetrics } from "@muneeb-systems/shared-types";
import { processingQueueSchema } from "@muneeb-systems/shared-schemas";
import type { GeneratorAppConfig } from "../../config/app-config.js";
import { SafeFileWriter } from "../filesystem/safe-file-writer.js";

export class JsonProcessingQueueRepository {
  private readonly writer: SafeFileWriter;

  public constructor(private readonly config: GeneratorAppConfig) {
    this.writer = new SafeFileWriter(config.dataDirectory);
  }

  public async getQueue(): Promise<ProcessingQueue> {
    try {
      return processingQueueSchema.parse(JSON.parse(await this.readQueueFile()) as unknown);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
      const now = new Date().toISOString();
      return {
        schemaVersion: 1,
        id: "local-processing-queue",
        state: "IDLE",
        paused: false,
        workerLock: null,
        createdAt: now,
        updatedAt: now,
        recoveredAt: null,
        jobs: [],
        metrics: emptyMetrics()
      };
    }
  }

  private async readQueueFile(): Promise<string> {
    let lastError: NodeJS.ErrnoException | null = null;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        return await readFile(this.config.aiQueuePath, "utf8");
      } catch (error) {
        lastError = error as NodeJS.ErrnoException;
        if (!["ENOENT", "EPERM", "EBUSY"].includes(lastError.code ?? "")) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
    throw lastError ?? new Error("Queue file could not be read.");
  }

  public async saveQueue(queue: ProcessingQueue): Promise<void> {
    await this.writer.writeJsonWithBackup(
      this.config.aiQueuePath,
      queue,
      this.config.aiBackupDirectory,
      "queue",
      20
    );
  }

  public async appendEvent(event: QueueEvent): Promise<void> {
    await mkdir(path.dirname(this.config.aiQueueEventsPath), { recursive: true });
    await appendFile(this.config.aiQueueEventsPath, `${JSON.stringify(event)}\n`, "utf8");
  }
}

export function emptyMetrics(): QueueMetrics {
  return {
    selectedRepositories: 0,
    eligibleRepositories: 0,
    pending: 0,
    active: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    interrupted: 0,
    completedDrafts: 0,
    averageGenerationDurationMs: null
  };
}
