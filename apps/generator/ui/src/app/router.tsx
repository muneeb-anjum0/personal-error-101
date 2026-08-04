import { useEffect, useState } from "react";
import { ContentPage } from "../features/content/content-page";
import { ContentManagementPage } from "../features/content-management/content-management-page";
import { DashboardPage } from "../features/dashboard/dashboard-page";
import { AiPage } from "../features/ai/ai-page";
import { LogsPage } from "../features/logs/logs-page";
import { RepositoriesPage } from "../features/repositories/repositories-page";
import { SettingsPage } from "../features/settings/settings-page";
import { SystemPage } from "../features/system/system-page";
import { activeRoutes, type AppRoute } from "./routes";

export function useRouter() {
  const [path, setPath] = useState<AppRoute>(normalizePath(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(next: string) {
    const normalized = normalizePath(next);
    window.history.pushState(null, "", normalized);
    setPath(normalized);
  }

  return { path, navigate };
}

export function RouteView({ path }: { path: AppRoute }) {
  switch (path) {
    case "/content":
      return <ContentPage />;
    case "/content/profile":
      return <ContentManagementPage type="profile" />;
    case "/content/experience":
      return <ContentManagementPage type="experience" />;
    case "/content/skills":
      return <ContentManagementPage type="skills" />;
    case "/content/activity":
      return <ContentManagementPage type="activity" />;
    case "/settings":
      return <SettingsPage />;
    case "/logs":
      return <LogsPage />;
    case "/ai":
      return <AiPage />;
    case "/repositories":
      return <RepositoriesPage />;
    case "/system":
      return <SystemPage />;
    default:
      return <DashboardPage />;
  }
}

function normalizePath(path: string): AppRoute {
  return activeRoutes.some((route) => route.path === path) ? (path as AppRoute) : "/";
}
