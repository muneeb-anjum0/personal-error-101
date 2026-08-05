import { useEffect, useRef, useState } from "react";
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
  const [transition, setTransition] = useState<"opening" | "closing" | "idle">("opening");
  const pathRef = useRef(path);
  const timers = useRef<number[]>([]);

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }

  function transitionTo(next: AppRoute, push: boolean) {
    if (next === pathRef.current) return;
    clearTimers();
    setTransition("closing");
    timers.current.push(
      window.setTimeout(() => {
        if (push) window.history.pushState(null, "", next);
        pathRef.current = next;
        setPath(next);
        window.scrollTo({ top: 0 });
        setTransition("opening");
        timers.current.push(window.setTimeout(() => setTransition("idle"), 460));
      }, 190)
    );
  }

  useEffect(() => {
    const openingTimer = window.setTimeout(() => setTransition("idle"), 460);
    const onPopState = () => transitionTo(normalizePath(window.location.pathname), false);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.clearTimeout(openingTimer);
      clearTimers();
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  function navigate(next: string) {
    const normalized = normalizePath(next);
    transitionTo(normalized, true);
  }

  return { path, navigate, transition };
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
