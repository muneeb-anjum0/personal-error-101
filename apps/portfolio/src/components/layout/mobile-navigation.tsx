"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface MobileNavigationProps {
  items: Array<{ label: string; href: string; section?: string }>;
}

export function MobileNavigation({ items }: MobileNavigationProps) {
  const [menuState, setMenuState] = useState<"closed" | "open" | "closing">("closed");
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const isOpen = menuState !== "closed";

  function closeMenu() {
    setMenuState((current) => (current === "closed" ? current : "closing"));
  }

  function finishClosing() {
    setMenuState((current) => (current === "closing" ? "closed" : current));
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (menuState !== "closing") {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      return;
    }

    // Animation events can be dropped when the browser is under load or a user
    // taps the control again mid-transition. Always release the overlay.
    closeTimerRef.current = window.setTimeout(finishClosing, 720);
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [menuState]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousLenis = document.documentElement.classList.contains("lenis-active");
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("scroll-locked");
    buttonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    const media = window.matchMedia("(min-width: 1025px)");
    const onResize = () => {
      if (media.matches) {
        closeMenu();
      }
    };
    media.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.classList.remove("scroll-locked");
      if (previousLenis) {
        document.documentElement.classList.add("lenis-active");
      }
      window.removeEventListener("keydown", onKeyDown);
      media.removeEventListener("change", onResize);
      buttonRef.current?.focus();
    };
  }, [isOpen]);

  return (
    <div className={`mobile-nav${isOpen ? " is-open" : ""}`}>
      <button
        ref={buttonRef}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        className="mobile-menu-button"
        type="button"
        onClick={() =>
          setMenuState((current) => (current === "closed" ? "open" : current === "open" ? "closing" : current))
        }
      >
        <span aria-hidden="true" />
        <span>MENU</span>
      </button>
      {isOpen && mounted
        ? createPortal(
            <div
              className={`mobile-menu${menuState === "closing" ? " is-closing" : ""}`}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              onAnimationEnd={(event) => {
                if (menuState === "closing" && event.target === event.currentTarget) {
                  finishClosing();
                }
              }}
              onClick={closeMenu}
            >
              <div className="mobile-menu-panel" onClick={(event) => event.stopPropagation()}>
                <header>
                  <span>NAVIGATION</span>
                </header>
                <nav aria-label="Mobile">
                  {items.map((item, index) => (
                    <a key={item.href} href={item.href} onClick={closeMenu}>
                      <small>{String(index + 1).padStart(2, "0")}</small>
                      <span>{item.label}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  ))}
                </nav>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
