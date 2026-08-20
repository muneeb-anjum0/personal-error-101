import { Sidebar } from "../components/layout/sidebar";
import { MobileNavigation } from "../components/layout/mobile-navigation";
import { ToastProvider } from "../components/feedback/toast-provider";
import { RouteView, useRouter } from "./router";
import { activeRoutes } from "./routes";

export function AppShell() {
  const router = useRouter();
  const route = activeRoutes.find((item) => item.path === router.path);

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar activePath={router.path} onNavigate={router.navigate} />
        <div className="workspace">
          <header className="workspace-header">
            <div>
              <p className="eyebrow">LOCAL PORTFOLIO GENERATOR</p>
              <strong>{route?.label ?? "WORKSPACE"}</strong>
            </div>
            <p className="workspace-mode">LOCAL / PRIVATE</p>
            <MobileNavigation activePath={router.path} onNavigate={router.navigate} />
          </header>
          <main id="main" className="page-container">
            <div className={`route-stage is-${router.transition}`} key={router.path}>
              <RouteView path={router.path} />
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
