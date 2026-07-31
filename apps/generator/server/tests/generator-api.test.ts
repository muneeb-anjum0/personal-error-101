import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../src/server";

let app: FastifyInstance | undefined;

async function server(): Promise<FastifyInstance> {
  process.env.NODE_ENV = "test";
  app = await buildServer();
  return app;
}

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("generator API", () => {
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
        github: false,
        ai: false,
        publishing: false
      }
    });
    expect((await instance.inject({ method: "GET", url: "/api/version" })).json()).toMatchObject({
      name: "MUNEEB.SYSTEMS GENERATOR",
      phase: "phase-3-generator-platform"
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
    expect((await instance.inject({ method: "GET", url: "/api/docs" })).json()).toHaveProperty(
      "openapi",
      "3.1.0"
    );
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
