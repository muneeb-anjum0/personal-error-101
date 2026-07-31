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
  it("returns health status", async () => {
    const response = await (await server()).inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "healthy" });
  });

  it("returns readiness states without pretending future integrations work", async () => {
    const response = await (await server()).inject({ method: "GET", url: "/ready" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "ready",
      services: {
        filesystem: true,
        github: false,
        ai: false
      }
    });
  });
});
