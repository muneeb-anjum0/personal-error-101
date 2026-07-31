"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ExperienceEntry, Profile, SkillCategory } from "@muneeb-systems/shared-types";
import type { VisibleProject } from "@/lib/portfolio-selectors";
import { useMotionSettings } from "@/components/motion/reduced-motion-provider";
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
  const { reducedMotion } = useMotionSettings();
  const panelInitial = reducedMotion ? { opacity: 0 } : { opacity: 0, rotateY: -7, x: 72 };
  const panelExit = reducedMotion ? { opacity: 0 } : { opacity: 0, rotateY: -5, x: 46 };

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("scroll-locked");
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.classList.remove("scroll-locked");
      window.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        className="nav-quick-view"
        data-cursor="OPEN"
        type="button"
        onClick={() => setOpen(true)}
      >
        QUICK VIEW
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="dialog-backdrop"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            role="presentation"
            transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
            onMouseDown={() => setOpen(false)}
          >
            <motion.section
              animate={{ opacity: 1, rotateY: 0, x: 0 }}
              aria-labelledby="quick-view-title"
              aria-modal="true"
              className="quick-view-dialog"
              exit={panelExit}
              initial={panelInitial}
              role="dialog"
              transition={{ duration: reducedMotion ? 0.12 : 0.38, ease: [0.16, 1, 0.3, 1] }}
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
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
