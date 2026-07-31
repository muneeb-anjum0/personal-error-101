import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { githubTokenStatusSchema } from "@muneeb-systems/shared-schemas";
import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server";

describe("Phase 7 publishing security boundaries", () => {
  it("reports GitHub token status without exposing the token", async () => {
    process.env.NODE_ENV = "test";
    process.env.GITHUB_TOKEN = "github_pat_should_never_escape";
    const app = await buildServer();
    const response = await app.inject({ method: "POST", url: "/api/github/auth/check" });
    const body = githubTokenStatusSchema.parse(response.json());

    expect(body).toMatchObject({
      configured: true,
      authenticated: true,
      statusLabel: "GITHUB TOKEN CONFIGURED"
    });
    expect(JSON.stringify(body)).not.toContain("github_pat_should_never_escape");
    await app.close();
    process.env.GITHUB_TOKEN = "";
  });

  it("does not add generator Vercel deployment endpoints or token requirements", async () => {
    const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const docs = await readFile(
      path.join(serverRoot, "src", "api", "routes", "docs-routes.ts"),
      "utf8"
    );
    const routes = await readFile(
      path.join(serverRoot, "src", "api", "routes", "publishing-routes.ts"),
      "utf8"
    );
    const packageJson = await readFile(
      path.resolve(serverRoot, "..", "..", "..", "package.json"),
      "utf8"
    );

    expect(docs).not.toContain("/deploy");
    expect(routes).not.toContain("vercel");
    expect(packageJson.toLowerCase()).not.toContain("@vercel");
    expect(`${docs}\n${routes}`).not.toContain("VERCEL_TOKEN");
  });
});
