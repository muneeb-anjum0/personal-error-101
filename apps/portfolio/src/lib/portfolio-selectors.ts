import type {
  ContentBundle,
  ExperienceEntry,
  Profile,
  Project,
  SkillCategory
} from "@muneeb-systems/shared-types";

export type VisibleProject = Project & { slug: string };

export const projectFilters = [
  "Featured",
  "AI",
  "Full Stack",
  "Security",
  "Machine Learning",
  "All"
];

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

export function filterProjects(projects: VisibleProject[], filter: string): VisibleProject[] {
  if (filter === "All") {
    return projects;
  }

  if (filter === "Featured") {
    return projects.filter((project) => project.featured);
  }

  return projects.filter((project) => {
    return [...project.categories, ...project.tags].some(
      (category) => category.toLowerCase() === filter.toLowerCase()
    );
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
    year: "numeric"
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
  project: Pick<Project, "id" | "name" | "technologies" | "categories">
) {
  const seed = [...project.id].reduce((total, char) => total + char.charCodeAt(0), 0);
  const nodeCount = Math.max(
    4,
    Math.min(8, project.technologies.length + project.categories.length)
  );

  return {
    abbreviation: project.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase())
      .join(""),
    seed,
    nodeCount,
    offset: seed % 19
  };
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
