import { createHash, randomUUID } from "node:crypto";
import type { PreviewSession } from "@muneeb-systems/shared-types";
import type { PreviewSessionRepository } from "../../infrastructure/preview/preview-session-repository.js";
import type { StagedContentService } from "./staged-content-service.js";
import { GeneratorError } from "../../domain/errors/generator-error.js";

export class PreviewService {
  public constructor(
    private readonly sessions: PreviewSessionRepository,
    private readonly staged: StagedContentService
  ) {}

  public async createSession(): Promise<PreviewSession> {
    const data = await this.staged.effectiveBundle();
    const createdAt = new Date();
    const session: PreviewSession = {
      schemaVersion: 1,
      id: `preview_${randomUUID()}`,
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + 1000 * 60 * 60 * 4).toISOString(),
      status: "ACTIVE",
      bundleHash: hash(data),
      warnings: []
    };
    await this.sessions.save(session, data);
    return session;
  }

  public listSessions() {
    return this.sessions.list();
  }

  public async getSession(id: string): Promise<PreviewSession> {
    const session = await this.sessions.get(id);
    if (!session)
      throw new GeneratorError("PREVIEW_SESSION_NOT_FOUND", "Preview session was not found.", 404);
    return session;
  }

  public async getData(id: string): Promise<unknown> {
    await this.getSession(id);
    const data = await this.sessions.getData(id);
    if (!data)
      throw new GeneratorError("PREVIEW_DATA_NOT_FOUND", "Preview data was not found.", 404);
    return data;
  }
}

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
