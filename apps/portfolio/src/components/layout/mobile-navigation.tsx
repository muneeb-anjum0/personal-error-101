"use client";

import { useEffect, useRef, useState } from "react";

interface MobileNavigationProps {
  items: Array<{ label: string; href: string }>;
}

export function MobileNavigation({ items }: MobileNavigationProps) {
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
    <div className="mobile-nav">
      <button
        ref={buttonRef}
        aria-expanded={open}
        aria-label="Open navigation menu"
        className="mobile-menu-button"
        type="button"
        onClick={() => setOpen(true)}
      >
        MENU
      </button>
      {open ? (
        <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <button
            ref={closeRef}
            className="mobile-menu-close"
            type="button"
            onClick={() => setOpen(false)}
          >
            CLOSE
          </button>
          <nav aria-label="Mobile">
            {items.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
