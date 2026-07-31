import path from "node:path";
import { describe, expect, it } from "vitest";
import { ContentValidationError, ContentEngine } from "../src";

const dataDirectory = path.resolve(process.cwd(), "../../data");

describe("ContentEngine", () => {
  it("loads and validates the starter content bundle", async () => {
    const engine = new ContentEngine({ dataDirectory });

    await expect(engine.loadBundle()).resolves.toMatchObject({
      profile: { name: "Muneeb Anjum" },
      generatorState: { schemaVersion: 1 }
    });
  });

  it("exposes clear validation errors", () => {
    const error = new ContentValidationError("bad.json", [
      {
        code: "custom",
        path: ["name"],
        message: "Expected a name",
        input: undefined
      }
    ]);

    expect(error.message).toContain("bad.json");
    expect(error.message).toContain("Expected a name");
  });
});
