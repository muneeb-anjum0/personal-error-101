import { useEffect, useState } from "react";
import { ContentPage } from "../features/content/content-page";
import { DashboardPage } from "../features/dashboard/dashboard-page";
import { LogsPage } from "../features/logs/logs-page";
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
    case "/settings":
      return <SettingsPage />;
    case "/logs":
      return <LogsPage />;
    case "/system":
      return <SystemPage />;
    default:
      return <DashboardPage />;
  }
}

function normalizePath(path: string): AppRoute {
  return activeRoutes.some((route) => route.path === path) ? (path as AppRoute) : "/";
}
