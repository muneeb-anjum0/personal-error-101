import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../src/server";

let app: FastifyInstance | undefined;

async function server(): Promise<FastifyInstance> {
  process.env.NODE_ENV = "test";
  process.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
  app = await buildServer();
  return app;
}

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("generator API", () => {
  beforeEach(() => {
    process.env.GITHUB_TOKEN = "";
  });

  it("returns health, readiness, and version metadata", async () => {
    const instance = await server();

    expect((await instance.inject({ method: "GET", url: "/health" })).json()).toEqual({
      status: "healthy"
    });
    expect((await instance.inject({ method: "GET", url: "/ready" })).json()).toMatchObject({
      status: "ready",
      services: {
        filesystem: true,
        content: true,
        settings: true,
        github: true,
        ai: false,
        publishing: false
      }
    });
    expect((await instance.inject({ method: "GET", url: "/api/version" })).json()).toMatchObject({
      name: "MUNEEB.SYSTEMS GENERATOR",
      phase: "phase-5-local-ai-runtime-queue"
    });
  });

  it("returns dashboard, content, logs, settings, system, and docs endpoints", async () => {
    const instance = await server();

    expect((await instance.inject({ method: "GET", url: "/api/dashboard" })).json()).toMatchObject({
      application: { name: "MUNEEB.SYSTEMS GENERATOR" }
    });
    expect(
      (await instance.inject({ method: "GET", url: "/api/content/status" })).json()
    ).toHaveProperty("files");
    expect(
      (await instance.inject({ method: "GET", url: "/api/content/projects" })).json()
    ).toHaveProperty("json");
    expect(
      (await instance.inject({ method: "GET", url: "/api/logs?limit=5" })).json()
    ).toHaveProperty("entries");
    expect((await instance.inject({ method: "GET", url: "/api/settings" })).json()).toHaveProperty(
      "schemaVersion",
      1
    );
    expect((await instance.inject({ method: "GET", url: "/api/system" })).json()).toHaveProperty(
      "repositoryRoot"
    );
    expect(
      (await instance.inject({ method: "GET", url: "/api/github/status" })).json()
    ).toMatchObject({
      authenticationState: "ANONYMOUS",
      tokenStatus: "TOKEN NOT CONFIGURED"
    });
    expect(
      (await instance.inject({ method: "GET", url: "/api/github/repositories" })).json()
    ).toHaveProperty("items");
    expect(
      (await instance.inject({ method: "GET", url: "/api/github/sync/status" })).json()
    ).toHaveProperty("phase");
    expect(
      (await instance.inject({ method: "GET", url: "/api/ai/runtime" })).json()
    ).toHaveProperty("status");
    expect((await instance.inject({ method: "GET", url: "/api/queue" })).json()).toHaveProperty(
      "jobs"
    );
    expect((await instance.inject({ method: "GET", url: "/api/drafts" })).json()).toHaveProperty(
      "items"
    );
    expect((await instance.inject({ method: "GET", url: "/api/docs" })).json()).toHaveProperty(
      "openapi",
      "3.1.0"
    );
  });

  it("validates GitHub repository queries and keeps tokens out of responses", async () => {
    process.env.GITHUB_TOKEN = "ghp_should_not_escape";
    const instance = await server();
    const invalid = await instance.inject({
      method: "GET",
      url: "/api/github/repositories?sort=unsafe"
    });
    expect(invalid.statusCode).toBe(400);

    const status = await instance.inject({ method: "GET", url: "/api/github/status" });
    expect(JSON.stringify(status.json())).not.toContain("ghp_should_not_escape");
    process.env.GITHUB_TOKEN = "";
  });

  it("uses the shared error contract for unsupported content types", async () => {
    const response = await (
      await server()
    ).inject({
      method: "GET",
      url: "/api/content/not-a-file",
      headers: { "x-request-id": "req_validrequestid" }
    });

    expect(response.statusCode).toBe(400);
    expect(response.headers["x-request-id"]).toBe("req_validrequestid");
    expect(response.json()).toMatchObject({
      error: {
        code: "UNSUPPORTED_CONTENT_TYPE",
        requestId: "req_validrequestid"
      }
    });
  });

  it("validates settings updates", async () => {
    const instance = await server();
    const invalid = await instance.inject({
      method: "PUT",
      url: "/api/settings",
      payload: { modelBaseUrl: "nope" }
    });

    expect(invalid.statusCode).toBe(400);
    expect(invalid.json()).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
  });
});
