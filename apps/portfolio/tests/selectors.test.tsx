import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Project } from "@muneeb-systems/shared-types";
import {
  buildExternalLinkProps,
  filterProjects,
  formatDisplayDate,
  getVisibleProjects,
  makeProjectCoverSignature,
  selectFeaturedProjects,
  sortProjectsByLatestPush
} from "../src/lib/portfolio-selectors";

const baseProject = {
  status: "draft",
  tags: [],
  links: [],
  starter: { editable: true, note: "test" },
  technologies: [],
  categories: [],
  featured: false,
  hidden: false,
  keyFeatures: [],
  challenges: [],
  technicalHighlights: [],
  relatedSkillIds: []
} satisfies Partial<Project>;

function project(overrides: Partial<Project>): Project {
  return {
    ...baseProject,
    id: overrides.id ?? "id",
    name: overrides.name ?? "Project",
    summary: overrides.summary ?? "Summary",
    ...overrides
  } as Project;
}

describe("portfolio selectors", () => {
  it("sorts projects by latest pushed date", () => {
    const sorted = sortProjectsByLatestPush([
      project({ id: "old", pushedAt: "2026-01-01" }),
      project({ id: "new", pushedAt: "2026-07-01" })
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["new", "old"]);
  });

  it("filters visible projects by category and featured state", () => {
    const projects = getVisibleProjects([
      project({ id: "a", categories: ["AI"], featured: true }),
      project({ id: "b", categories: ["Security"], featured: false }),
      project({ id: "hidden", hidden: true })
    ]);

    expect(filterProjects(projects, "AI")).toHaveLength(1);
    expect(filterProjects(projects, "Featured")).toHaveLength(1);
    expect(filterProjects(projects, "All")).toHaveLength(2);
  });

  it("selects featured projects and fills from newest projects", () => {
    const projects = getVisibleProjects([
      project({ id: "featured", featured: true, pushedAt: "2026-01-01" }),
      project({ id: "newest", pushedAt: "2026-07-01" })
    ]);

    expect(selectFeaturedProjects(projects, 2).map((item) => item.id)).toEqual([
      "featured",
      "newest"
    ]);
  });

  it("formats dates and builds safe external link props", () => {
    expect(formatDisplayDate("2026-07-31")).toContain("2026");
    expect(buildExternalLinkProps("https://example.com")).toMatchObject({
      target: "_blank",
      rel: "noreferrer"
    });
  });

  it("creates deterministic project cover signatures", () => {
    const item = project({
      id: "stable",
      name: "Stable Cover",
      technologies: ["A"],
      categories: ["B"]
    });

    expect(makeProjectCoverSignature(item)).toEqual(makeProjectCoverSignature(item));
  });

  it("selects compact cover families from project metadata", () => {
    expect(
      makeProjectCoverSignature(project({ id: "audio", technologies: ["WavLM"] })).family
    ).toBe("SIGNAL");
    expect(
      makeProjectCoverSignature(project({ id: "security", categories: ["AppSec"] })).family
    ).toBe("SECURITY");
    expect(
      makeProjectCoverSignature(project({ id: "offline", tags: ["offline-first"] })).family
    ).toBe("OFFLINE");
  });
});

describe("portfolio component foundations", () => {
  it("defines explicit button contrast variants", () => {
    const css = readFileSync(path.resolve(process.cwd(), "src/styles/globals.css"), "utf8");

    expect(css).toContain(".button-primary");
    expect(css).toContain(".button-secondary");
    expect(css).toContain(".button-ghost");
    expect(css).toContain("background: var(--foreground)");
    expect(css).toContain("color: var(--background)");
  });

  it("keeps empty state component technical and concise", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/components/ui/empty-state/empty-state.tsx"),
      "utf8"
    );

    expect(source).toContain("empty-state");
    expect(source).toContain('role="status"');
  });
});
