import type {
  ContentBundle,
  ExperienceEntry,
  Profile,
  Project,
  SkillCategory
} from "@muneeb-systems/shared-types";

export type VisibleProject = Project & { slug: string };
export type ProjectCoverFamily =
  | "OFFLINE"
  | "INTEGRATION"
  | "CLOUD"
  | "DATA"
  | "SIGNAL"
  | "AI"
  | "SECURITY"
  | "FULL_STACK"
  | "WORKFLOW";

export function getVisibleProjects(projects: Project[]): VisibleProject[] {
  return projects
    .filter((project) => !project.hidden)
    .map((project) => ({ ...project, slug: project.slug ?? project.id }));
}

export function sortProjectsByLatestPush<TProject extends Project>(
  projects: TProject[]
): TProject[] {
  return [...projects].sort((first, second) => {
    return getProjectTime(second) - getProjectTime(first);
  });
}

export function selectFeaturedProjects(projects: VisibleProject[], limit = 3): VisibleProject[] {
  const sorted = sortProjectsByLatestPush(projects);
  const featured = sorted.filter((project) => project.featured);
  const fill = sorted.filter((project) => !featured.includes(project));

  return [...featured, ...fill].slice(0, limit);
}

export function selectProjectBySlug(projects: Project[], slug: string): VisibleProject | undefined {
  return getVisibleProjects(projects).find((project) => project.slug === slug);
}

export function selectAdjacentProjects(projects: VisibleProject[], slug: string) {
  const sorted = sortProjectsByLatestPush(projects);
  const index = sorted.findIndex((project) => project.slug === slug);

  return {
    previous: index > 0 ? sorted[index - 1] : undefined,
    next: index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : undefined
  };
}

export function getCapabilityUsage(skill: SkillCategory, projects: VisibleProject[]) {
  const relatedProjects = projects.filter((project) => {
    return (
      project.relatedSkillIds.includes(skill.id) ||
      project.categories.some((category) => category.toLowerCase() === skill.name.toLowerCase()) ||
      project.tags.some((tag) => tag.toLowerCase() === skill.name.toLowerCase())
    );
  });

  return {
    skill,
    relatedProjects,
    projectCount: relatedProjects.length
  };
}

export function getIdentityStats(bundle: ContentBundle) {
  const configured = bundle.profile.stats;
  if (configured.length > 0) {
    return configured;
  }

  return [
    { label: "Professional roles", value: String(bundle.experience.length) },
    { label: "Primary disciplines", value: String(bundle.skills.length) },
    { label: "Portfolio systems", value: String(getVisibleProjects(bundle.projects).length) }
  ];
}

export function getContactLinks(profile: Profile) {
  return [
    { label: "Email", href: `mailto:${profile.email}`, external: false },
    { label: "GitHub", href: profile.githubUrl, external: true },
    { label: "LinkedIn", href: profile.linkedInUrl, external: true }
  ];
}

export function formatDisplayDate(value?: string): string {
  if (!value) {
    return "DATE PENDING";
  }

  const time = getDateTime(value);
  if (time === 0) {
    return value.toUpperCase();
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  })
    .format(new Date(time))
    .toUpperCase();
}

export function buildExternalLinkProps(href: string) {
  const isExternal = /^https?:\/\//.test(href);
  return {
    href,
    target: isExternal ? "_blank" : undefined,
    rel: isExternal ? "noreferrer" : undefined
  };
}

export function makeProjectCoverSignature(
  project: Pick<Project, "id" | "name" | "technologies" | "categories" | "tags">
) {
  const seed = [...project.id].reduce((total, char) => total + char.charCodeAt(0), 0);
  const family = selectProjectCoverFamily(project);
  const nodeCountByFamily: Record<ProjectCoverFamily, number> = {
    OFFLINE: 6,
    INTEGRATION: 6,
    CLOUD: 7,
    DATA: 7,
    SIGNAL: 7,
    AI: 7,
    SECURITY: 7,
    FULL_STACK: 6,
    WORKFLOW: 5
  };

  return {
    abbreviation: project.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase())
      .join(""),
    seed,
    family,
    nodeCount: nodeCountByFamily[family],
    offset: seed % 19
  };
}

function selectProjectCoverFamily(
  project: Pick<Project, "technologies" | "categories" | "tags">
): ProjectCoverFamily {
  const vocabulary = [...project.technologies, ...project.categories, ...project.tags]
    .join(" ")
    .toLowerCase();
  const has = (...terms: string[]) => terms.some((term) => vocabulary.includes(term));

  if (has("appsec", "security scanner", "code audit", "semgrep", "vulnerability")) {
    return "SECURITY";
  }
  if (has("audio", "speech", "wavlm", "spectrogram", "sound")) return "SIGNAL";
  if (has("offline", "pwa", "offline-first")) return "OFFLINE";
  if (has("email", "gmail", "timetable", "oauth")) return "INTEGRATION";
  if (has("firebase", "firestore") && !has("fastapi", "flask", "express", "node.js")) {
    return "CLOUD";
  }
  if (has("data visualization", "data-visualization", "dashboard", "analytics", "pandas")) {
    return "DATA";
  }
  if (has("llama", "qwen", "gguf", "machine learning", "ai-ml", "transformers")) {
    return "AI";
  }
  if (has("react", "next.js") && has("fastapi", "flask", "express", "node.js", "asp.net")) {
    return "FULL_STACK";
  }
  return "WORKFLOW";
}

export function getProjectTime(project: Project): number {
  return getDateTime(project.pushedAt ?? project.updatedAt ?? project.createdAt);
}

function getDateTime(value?: string): number {
  if (!value) {
    return 0;
  }

  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

export function summarizeExperience(experience: ExperienceEntry[]) {
  return experience.map((entry) => `${entry.role} at ${entry.organization}`).join(" / ");
}
