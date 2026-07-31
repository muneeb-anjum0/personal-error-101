import { advancedRoutes, futureRoutes, workflowRoutes, type AppRoute } from "../../app/routes";

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
        <strong>ADMIN</strong>
      </div>
      <nav aria-label="Generator navigation">
        <p className="nav-group">WORKFLOW</p>
        {workflowRoutes.map((route) => (
          <button
            key={route.path}
            aria-current={route.path === activePath ? "page" : undefined}
            type="button"
            onClick={() => onNavigate(route.path)}
          >
            {route.label}
          </button>
        ))}
        <details className="nav-advanced">
          <summary>ADVANCED</summary>
          <div>
            {advancedRoutes.map((route) => (
              <button
                key={route.path}
                aria-current={route.path === activePath ? "page" : undefined}
                type="button"
                onClick={() => onNavigate(route.path)}
              >
                {route.label}
              </button>
            ))}
          </div>
        </details>
        {futureRoutes.map((route) => (
          <button key={route.path} disabled type="button" title="COMING IN A LATER PHASE">
            <span>{route.label}</span>
            <small>COMING IN A LATER PHASE</small>
          </button>
        ))}
      </nav>
      <p className="version-label">LOCAL / PRIVATE</p>
    </aside>
  );
}
