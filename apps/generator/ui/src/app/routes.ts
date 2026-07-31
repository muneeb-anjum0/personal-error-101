export const workflowRoutes = [
  { path: "/", label: "OVERVIEW" },
  { path: "/repositories", label: "REPOS" },
  { path: "/queue", label: "QUEUE" },
  { path: "/review", label: "REVIEW" },
  { path: "/content", label: "CONTENT" },
  { path: "/publish", label: "PUBLISH" }
] as const;

export const advancedRoutes = [
  { path: "/drafts", label: "Drafts" },
  { path: "/ai", label: "Local AI" },
  { path: "/content/profile", label: "PROFILE" },
  { path: "/content/projects", label: "PROJECTS" },
  { path: "/content/experience", label: "EXPERIENCE" },
  { path: "/content/skills", label: "SKILLS" },
  { path: "/content/activity", label: "ACTIVITY" },
  { path: "/preview", label: "PREVIEW" },
  { path: "/settings", label: "SETTINGS" },
  { path: "/logs", label: "LOGS" },
  { path: "/system", label: "SYSTEM" }
] as const;

export const activeRoutes = [...workflowRoutes, ...advancedRoutes] as const;

export const futureRoutes: ReadonlyArray<{ path: string; label: string }> = [];

export type AppRoute = (typeof activeRoutes)[number]["path"];
