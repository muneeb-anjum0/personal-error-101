export const workflowRoutes = [
  { path: "/", label: "OVERVIEW" },
  { path: "/repositories", label: "REPOS" },
  { path: "/content", label: "CONTENT" },
  { path: "/settings", label: "SETTINGS" }
] as const;

export const advancedRoutes = [
  { path: "/ai", label: "Local AI" },
  { path: "/content/profile", label: "PROFILE" },
  { path: "/content/experience", label: "EXPERIENCE" },
  { path: "/content/skills", label: "SKILLS" },
  { path: "/content/activity", label: "ACTIVITY" },
  { path: "/logs", label: "LOGS" },
  { path: "/system", label: "SYSTEM" }
] as const;

export const activeRoutes = [...workflowRoutes, ...advancedRoutes] as const;

export const futureRoutes: ReadonlyArray<{ path: string; label: string }> = [];

export type AppRoute = (typeof activeRoutes)[number]["path"];
