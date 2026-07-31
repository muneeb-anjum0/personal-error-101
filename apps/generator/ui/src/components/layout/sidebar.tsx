import { activeRoutes, futureRoutes, type AppRoute } from "../../app/routes";

export function Sidebar({
  activePath,
  onNavigate
}: {
  activePath: AppRoute;
  onNavigate: (path: string) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span>MUNEEB.SYSTEMS</span>
        <strong>GENERATOR</strong>
      </div>
      <nav aria-label="Generator navigation">
        <p className="nav-group">WORKSPACE</p>
        {activeRoutes.map((route) => (
          <button
            key={route.path}
            aria-current={route.path === activePath ? "page" : undefined}
            type="button"
            onClick={() => onNavigate(route.path)}
          >
            {route.label}
          </button>
        ))}
        <p className="nav-group">FUTURE</p>
        {futureRoutes.map((route) => (
          <button key={route.path} disabled type="button" title="COMING IN A LATER PHASE">
            <span>{route.label}</span>
            <small>COMING IN A LATER PHASE</small>
          </button>
        ))}
      </nav>
      <p className="version-label">PHASE 3 / LOCAL ONLY</p>
    </aside>
  );
}
