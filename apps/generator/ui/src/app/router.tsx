import { useEffect, useState } from "react";
import { ContentPage } from "../features/content/content-page";
import { ContentManagementPage } from "../features/content-management/content-management-page";
import { DashboardPage } from "../features/dashboard/dashboard-page";
import { DraftsPage } from "../features/drafts/drafts-page";
import { AiPage } from "../features/ai/ai-page";
import { LogsPage } from "../features/logs/logs-page";
import { PreviewPage } from "../features/preview/preview-page";
import { PublishingPage } from "../features/publishing/publishing-page";
import { QueuePage } from "../features/queue/queue-page";
import { RepositoriesPage } from "../features/repositories/repositories-page";
import { ReviewPage } from "../features/reviews/review-page";
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
    case "/content/projects":
      return <ContentManagementPage type="projects" />;
    case "/content/experience":
      return <ContentManagementPage type="experience" />;
    case "/content/skills":
      return <ContentManagementPage type="skills" />;
    case "/content/activity":
      return <ContentManagementPage type="activity" />;
    case "/drafts":
      return <DraftsPage />;
    case "/review":
      return <ReviewPage />;
    case "/preview":
      return <PreviewPage />;
    case "/publish":
      return <PublishingPage />;
    case "/settings":
      return <SettingsPage />;
    case "/logs":
      return <LogsPage />;
    case "/queue":
      return <QueuePage />;
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
