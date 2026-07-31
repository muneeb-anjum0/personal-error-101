"use client";

import { useEffect, useRef, useState } from "react";
import type { ExperienceEntry, Profile, SkillCategory } from "@muneeb-systems/shared-types";
import type { VisibleProject } from "@/lib/portfolio-selectors";
import { QuickViewContent } from "./quick-view-content";

interface QuickViewDialogProps {
  profile: Profile;
  skills: SkillCategory[];
  projects: VisibleProject[];
  experience: ExperienceEntry[];
  resumeAvailable: boolean;
}

export function QuickViewDialog(props: QuickViewDialogProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
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
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        className="nav-quick-view"
        type="button"
        onClick={() => setOpen(true)}
      >
        QUICK VIEW
      </button>
      {open ? (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            aria-labelledby="quick-view-title"
            aria-modal="true"
            className="quick-view-dialog"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              ref={closeRef}
              className="dialog-close"
              type="button"
              onClick={() => setOpen(false)}
            >
              CLOSE
            </button>
            <h2 id="quick-view-title" className="sr-only">
              Quick View
            </h2>
            <QuickViewContent {...props} />
          </section>
        </div>
      ) : null}
    </>
  );
}
