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
            <RouteView path={router.path} />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
