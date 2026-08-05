import { futureRoutes, workflowRoutes, type AppRoute } from "../../app/routes";

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
        <strong>MUNEEB.SYSTEMS</strong>
      </div>
      <nav aria-label="Generator navigation">
        <p className="nav-group">
          <span>WORKSPACE</span>
          <small>04 VIEWS</small>
        </p>
        {workflowRoutes.map((route, index) => (
          <button
            key={route.path}
            aria-current={route.path === activePath ? "page" : undefined}
            type="button"
            onClick={() => onNavigate(route.path)}
          >
            <span className="sidebar-route-index">{String(index + 1).padStart(2, "0")}</span>
            <span>
              <strong>{route.label}</strong>
              <small>{routeDescription(route.path)}</small>
            </span>
            <span className="sidebar-route-arrow" aria-hidden="true">
              →
            </span>
          </button>
        ))}
        {futureRoutes.map((route) => (
          <button key={route.path} disabled type="button" title="COMING IN A LATER PHASE">
            <span>{route.label}</span>
            <small>COMING IN A LATER PHASE</small>
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <span aria-hidden="true" />
        <p className="version-label">
          LOCAL WORKSPACE
          <br />
          LAN ENABLED
        </p>
      </div>
    </aside>
  );
}

function routeDescription(path: string): string {
  if (path === "/") return "Status and activity";
  if (path === "/repositories") return "Sync and generate";
  if (path === "/content") return "Portfolio editor";
  return "Runtime controls";
}
