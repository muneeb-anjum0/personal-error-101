import { useEffect, useRef, useState } from "react";
import { advancedRoutes, futureRoutes, workflowRoutes, type AppRoute } from "../../app/routes";

export function MobileNavigation({
  activePath,
  onNavigate
}: {
  activePath: AppRoute;
  onNavigate: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      buttonRef.current?.focus();
    };
  }, [open]);

  return (
    <div className="mobile-navigation">
      <button ref={buttonRef} type="button" aria-expanded={open} onClick={() => setOpen(true)}>
        MENU
      </button>
      {open ? (
        <div
          className="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Generator navigation"
        >
          <button ref={closeRef} type="button" onClick={() => setOpen(false)}>
            CLOSE
          </button>
          <nav>
            {workflowRoutes.map((route) => (
              <button
                key={route.path}
                aria-current={route.path === activePath ? "page" : undefined}
                type="button"
                onClick={() => {
                  onNavigate(route.path);
                  setOpen(false);
                }}
              >
                {route.label}
              </button>
            ))}
            <p className="nav-group">ADVANCED</p>
            {advancedRoutes.map((route) => (
              <button
                key={route.path}
                aria-current={route.path === activePath ? "page" : undefined}
                type="button"
                onClick={() => {
                  onNavigate(route.path);
                  setOpen(false);
                }}
              >
                {route.label}
              </button>
            ))}
            {futureRoutes.map((route) => (
              <button key={route.path} disabled type="button">
                {route.label} / COMING IN A LATER PHASE
              </button>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
