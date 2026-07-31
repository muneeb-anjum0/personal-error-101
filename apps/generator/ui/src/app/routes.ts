export const activeRoutes = [
  { path: "/", label: "OVERVIEW" },
  { path: "/repositories", label: "REPOSITORIES" },
  { path: "/queue", label: "QUEUE" },
  { path: "/drafts", label: "DRAFTS" },
  { path: "/review", label: "REVIEW" },
  { path: "/ai", label: "LOCAL AI" },
  { path: "/content", label: "CONTENT" },
  { path: "/content/profile", label: "PROFILE" },
  { path: "/content/projects", label: "PROJECTS" },
  { path: "/content/experience", label: "EXPERIENCE" },
  { path: "/content/skills", label: "SKILLS" },
  { path: "/content/activity", label: "ACTIVITY" },
  { path: "/preview", label: "PREVIEW" },
  { path: "/publish", label: "PUBLISH" },
  { path: "/settings", label: "SETTINGS" },
  { path: "/logs", label: "LOGS" },
  { path: "/system", label: "SYSTEM" }
] as const;

export const futureRoutes: ReadonlyArray<{ path: string; label: string }> = [];

export type AppRoute = (typeof activeRoutes)[number]["path"];
