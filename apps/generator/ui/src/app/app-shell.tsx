import { Sidebar } from "../components/layout/sidebar";
import { ToastProvider } from "../components/feedback/toast-provider";
import { RouteView, useRouter } from "./router";

export function AppShell() {
  const router = useRouter();

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar activePath={router.path} onNavigate={router.navigate} />
        <div className="workspace">
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
