export const activeRoutes = [
  { path: "/", label: "OVERVIEW" },
  { path: "/repositories", label: "REPOSITORIES" },
  { path: "/content", label: "CONTENT" },
  { path: "/settings", label: "SETTINGS" },
  { path: "/logs", label: "LOGS" },
  { path: "/system", label: "SYSTEM" }
] as const;

export const futureRoutes = [
  { path: "/queue", label: "PROCESSING QUEUE" },
  { path: "/ai", label: "LOCAL AI" },
  { path: "/publish", label: "PUBLISH" }
] as const;

export type AppRoute = (typeof activeRoutes)[number]["path"];
