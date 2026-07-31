import type { AppRoute } from "../../app/routes";
import { MobileNavigation } from "./mobile-navigation";

export function Topbar({
  activePath,
  onNavigate
}: {
  activePath: AppRoute;
  onNavigate: (path: string) => void;
}) {
  return (
    <header className="topbar">
      <a href="#main" className="skip-link">
        Skip to dashboard content
      </a>
      <div>
        <span>MUNEEB.SYSTEMS</span>
        <strong>Admin</strong>
      </div>
      <MobileNavigation activePath={activePath} onNavigate={onNavigate} />
    </header>
  );
}
