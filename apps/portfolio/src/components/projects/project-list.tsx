"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { VisibleProject } from "@/lib/portfolio-selectors";
import { filterProjects, projectFilters } from "@/lib/portfolio-selectors";
import { EmptyState } from "@/components/ui/empty-state";
import { GeneratedProjectCover } from "@/components/visuals/generated-project-cover";
import { ProjectFilter } from "./project-filter";
import { ProjectPanel } from "./project-panel";

export function ProjectList({ projects }: { projects: VisibleProject[] }) {
  const [filter, setFilter] = useState("Featured");
  const [cursor, setCursor] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const visible = useMemo(() => filterProjects(projects, filter), [filter, projects]);
  const carouselEnabled = visible.length > 2;
  const normalizedCursor = visible.length > 0 ? cursor % visible.length : 0;
  const displayedProjects = carouselEnabled
    ? [0, 1].map((offset) => {
        const index = (normalizedCursor + offset) % visible.length;
        return { project: visible[index]!, index };
      })
    : visible.map((project, index) => ({ project, index }));
  const previousIndex = carouselEnabled
    ? (normalizedCursor - 1 + visible.length) % visible.length
    : 0;
  const nextIndex = carouselEnabled
    ? (normalizedCursor + 2) % visible.length
    : 0;
  const mobileNextIndex = carouselEnabled
    ? (normalizedCursor + 1) % visible.length
    : 0;

  const changeFilter = (nextFilter: string) => {
    setFilter(nextFilter);
    setCursor(0);
    setDirection(1);
  };

  const moveCarousel = (step: -1 | 1) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(step);
    setCursor((current) => (current + step + visible.length) % visible.length);
  };

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
      <ProjectFilter activeFilter={filter} filters={projectFilters} onChange={changeFilter} />
      {visible.length > 0 ? (
        <div className="project-carousel">
          <div className={`project-carousel-stage${carouselEnabled ? " is-looping" : ""}`}>
            {carouselEnabled ? (
              <>
                <CarouselPreview
                  direction={direction}
                  index={previousIndex}
                  project={visible[previousIndex]!}
                  side="left"
                />
                <CarouselPreview
                  direction={direction}
                  index={nextIndex}
                  project={visible[nextIndex]!}
                  side="right"
                />
                <CarouselPreview
                  direction={direction}
                  index={mobileNextIndex}
                  mobile
                  project={visible[mobileNextIndex]!}
                  side="right"
                />
              </>
            ) : null}
            <div className="project-carousel-track">
              <AnimatePresence initial={false} custom={direction} mode="popLayout" onExitComplete={() => setIsAnimating(false)}>
                <motion.div
                  className={`project-list${carouselEnabled ? " project-list-windowed" : ""}`}
                  custom={direction}
                  variants={carouselWindowVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  key={`${filter}-${normalizedCursor}`}
                  transition={{ duration: 0.72, ease: [0.76, 0, 0.24, 1] }}
                >
                  {displayedProjects.map(({ project, index }) => (
                    <div key={project.id}>
                      <ProjectPanel index={index} project={project} />
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
            {carouselEnabled ? (
              <>
                <button
                  aria-label="Show previous projects"
                  className="project-carousel-arrow project-carousel-arrow-left"
                  disabled={isAnimating}
                  onClick={() => moveCarousel(-1)}
                  type="button"
                >
                  <span aria-hidden="true">←</span>
                </button>
                <button
                  aria-label="Show next projects"
                  className="project-carousel-arrow project-carousel-arrow-right"
                  disabled={isAnimating}
                  onClick={() => moveCarousel(1)}
                  type="button"
                >
                  <span aria-hidden="true">→</span>
                </button>
                <p className="project-carousel-position" aria-live="polite">
                  <span className="project-carousel-count-desktop">2 OF {visible.length}</span>
                  <span className="project-carousel-count-mobile">1 OF {visible.length}</span>
                </p>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <EmptyState title="NO SYSTEMS MATCH THIS FILTER." message="SELECT ANOTHER CATEGORY." />
      )}
    </div>
  );
}

const carouselWindowVariants = {
  enter: (travelDirection: number) => ({ opacity: 0.2, x: `${travelDirection * 110}%` }),
  center: { opacity: 1, x: "0%" },
  exit: (travelDirection: number) => ({ opacity: 0.2, x: `${travelDirection * -110}%` })
};

const carouselPreviewVariants = {
  left: {
    enter: (travelDirection: number) => ({ opacity: 0, scale: 0.68, x: travelDirection * -84 }),
    center: { opacity: 0.42, scale: 0.78, x: 0 },
    exit: (travelDirection: number) => ({ opacity: 0, scale: 0.68, x: travelDirection * -120 })
  },
  right: {
    enter: (travelDirection: number) => ({ opacity: 0, scale: 0.68, x: travelDirection * 84 }),
    center: { opacity: 0.42, scale: 0.78, x: 0 },
    exit: (travelDirection: number) => ({ opacity: 0, scale: 0.68, x: travelDirection * -120 })
  }
};

function CarouselPreview({
  direction,
  index,
  mobile = false,
  project,
  side
}: {
  direction: number;
  index: number;
  mobile?: boolean;
  project: VisibleProject;
  side: "left" | "right";
}) {
  const className = [
    "project-carousel-preview",
    `project-carousel-preview-${side}`,
    side === "right" ? (mobile ? "project-carousel-preview-mobile" : "project-carousel-preview-desktop") : ""
  ].filter(Boolean).join(" ");

  return (
    <AnimatePresence initial={false} custom={direction} mode="popLayout">
      <motion.div
        aria-hidden="true"
        animate="center"
        className={className}
        custom={direction}
        exit="exit"
        initial="enter"
        key={`${side}-${mobile ? "mobile" : "desktop"}-${project.id}-${index}`}
        transition={{ duration: 0.72, ease: [0.76, 0, 0.24, 1] }}
        variants={carouselPreviewVariants[side]}
      >
        <ProjectPreview index={index} project={project} />
      </motion.div>
    </AnimatePresence>
  );
}

function ProjectPreview({ project, index }: { project: VisibleProject; index: number }) {
  return (
    <article className="project-carousel-preview-card">
      <GeneratedProjectCover index={index} project={project} />
      <div>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <h3>{project.name}</h3>
      </div>
    </article>
  );
}
