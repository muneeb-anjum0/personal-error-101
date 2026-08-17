"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { VisibleProject } from "@/lib/portfolio-selectors";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectPanel } from "./project-panel";

const PROJECTS_PER_VIEW = 2;
const CAROUSEL_DURATION_MS = 620;
const carouselVariants: Variants = {
  enter: (enterDirection: -1 | 1) => ({
    opacity: 0,
    scale: 0.82,
    x: enterDirection * 760,
  }),
  center: { opacity: 1, scale: 1, x: 0 },
  exit: (exitDirection: -1 | 1) => ({
    opacity: 0,
    scale: 0.82,
    x: exitDirection * -760,
  }),
};

export function ProjectList({ projects }: { projects: VisibleProject[] }) {
  const [startIndex, setStartIndex] = useState(0);
  const [direction, setDirection] = useState<-1 | 1>(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [projectsPerView, setProjectsPerView] = useState(PROJECTS_PER_VIEW);
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visible = projects;
  const hasNavigation = visible.length > projectsPerView;
  const normalizedStart =
    visible.length > 0 ? ((startIndex % visible.length) + visible.length) % visible.length : 0;
  const displayedProjects = hasNavigation
    ? Array.from({ length: projectsPerView }, (_, offset) => {
        const index = (normalizedStart + offset) % visible.length;
        return { index, project: visible[index]! };
      })
    : visible.map((project, index) => ({ index, project }));
  const visiblePositionLabel = displayedProjects
    .map(({ index }) => String(index + 1).padStart(2, "0"))
    .join(" — ");

  const move = (step: -1 | 1) => {
    if (isTransitioning || visible.length <= projectsPerView) return;

    setDirection(step);
    setIsTransitioning(true);
    setStartIndex((current) => current + step * projectsPerView);
    unlockTimer.current = setTimeout(() => {
      setIsTransitioning(false);
      unlockTimer.current = null;
    }, CAROUSEL_DURATION_MS);
  };

  useEffect(
    () => () => {
      if (unlockTimer.current) clearTimeout(unlockTimer.current);
    },
    [],
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const updateProjectsPerView = () => setProjectsPerView(media.matches ? 1 : PROJECTS_PER_VIEW);
    updateProjectsPerView();
    media.addEventListener("change", updateProjectsPerView);
    return () => media.removeEventListener("change", updateProjectsPerView);
  }, []);

  if (projects.length === 0) {
    return (
      <EmptyState
        title="NO PROJECTS YET."
        message="Generate a repository summary in the local admin to publish it here."
      />
    );
  }

  return (
    <div className="project-list-wrap">
      {visible.length > 0 ? (
        <div className="project-window">
          <div className="project-window-stage" aria-live="polite">
            <AnimatePresence custom={direction} initial={false} mode="sync">
              <motion.div
                key={normalizedStart}
                animate="center"
                className="project-list project-carousel-page"
                custom={direction}
                exit="exit"
                initial="enter"
                transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
                variants={carouselVariants}
              >
                {displayedProjects.map(({ index, project }) => (
                  <div key={project.id}>
                    <ProjectPanel index={index} project={project} />
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
          {hasNavigation ? (
            <nav aria-label="Project navigation" className="project-window-controls">
              <button
                aria-label="Show previous projects"
                disabled={isTransitioning}
                onClick={() => move(-1)}
                type="button"
              >
                <span aria-hidden="true">←</span>
                Previous
              </button>
              <p aria-live="polite">
                {visiblePositionLabel} OF {String(visible.length).padStart(2, "0")} PROJECTS
              </p>
              <button
                aria-label="Show next projects"
                disabled={isTransitioning}
                onClick={() => move(1)}
                type="button"
              >
                Next
                <span aria-hidden="true">→</span>
              </button>
            </nav>
          ) : null}
        </div>
      ) : (
        <EmptyState title="NO SYSTEMS MATCH THIS FILTER." message="SELECT ANOTHER CATEGORY." />
      )}
    </div>
  );
}
