import { describe, expect, it } from "vitest";
import { allowedMarkdownSources, splitMarkdownSources } from "../src/application/services/markdown-context.js";

describe("complete Markdown context", () => {
  const bundle = [
    "<!-- DOCUMENT: README.md -->\n# Overview\nAn unusual workflow survives.\n## Installation\nSetup decisions also survive.\n# Contributing\nAdministrative text is excluded.\n# Architecture\nThe API boundary matters.",
    "<!-- DOCUMENT: docs/odd-title.md -->\n# A peculiar but important name\nImportant evidence without a known keyword.",
    "<!-- DOCUMENT: CHANGELOG.md -->\n# History\nRelease details are excluded."
  ].join("\n\n");

  it("keeps unknown headings and setup while excluding only configured administrative sections/files", () => {
    const sources = allowedMarkdownSources(bundle, ["contributing", "changelog"]);
    expect(sources.map((source) => source.path)).toEqual(["README.md", "docs/odd-title.md"]);
    expect(sources[0]?.content).toContain("Setup decisions also survive.");
    expect(sources[0]?.content).toContain("The API boundary matters.");
    expect(sources[0]?.content).not.toContain("Administrative text is excluded.");
    expect(sources[1]?.content).toContain("Important evidence without a known keyword.");
  });

  it("sends every retained character across bounded chunks", () => {
    const sources = allowedMarkdownSources(bundle, ["contributing", "changelog"]);
    const chunks = splitMarkdownSources(sources, 115);
    expect(chunks.length).toBeGreaterThan(2);
    for (const source of sources) {
      const pieces = chunks
        .filter((chunk) => chunk.startsWith(`DOCUMENT: ${source.path}\n`))
        .map((chunk) => chunk.replace(/^DOCUMENT: [^\n]+\nPART: \d+\n/, ""));
      expect(pieces.join(""), source.path).toBe(source.content);
    }
    expect(chunks.every((chunk) => chunk.length <= 115)).toBe(true);
  });
});
