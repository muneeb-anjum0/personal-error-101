"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface MobileNavigationProps {
  items: Array<{ label: string; href: string }>;
}

export function MobileNavigation({ items }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousLenis = document.documentElement.classList.contains("lenis-active");
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("scroll-locked");
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    const media = window.matchMedia("(min-width: 1025px)");
    const onResize = () => {
      if (media.matches) {
        setOpen(false);
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
        <span aria-hidden="true" />
        <span>MENU</span>
      </button>
      {open && mounted
        ? createPortal(
            <div
              className="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
            >
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
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
