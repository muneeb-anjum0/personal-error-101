"use client";

import type { ContentBundle } from "@muneeb-systems/shared-types";
import { useEffect, useMemo, useState } from "react";
import {
  selectFeaturedProjects,
  sortProjectsByLatestPush,
  getVisibleProjects
} from "@/lib/portfolio-selectors";
import { useSectionVisibility } from "@/hooks/use-section-visibility";
import { MobileNavigation } from "./mobile-navigation";
import { QuickViewDialog } from "@/components/quick-view/quick-view-dialog";

const navItems = [
  { label: "ABOUT", href: "#identity" },
  { label: "EXPERIENCE", href: "#experience" },
  { label: "WORK", href: "#projects" },
  { label: "PHILOSOPHY", href: "#philosophy" },
  { label: "CONTACT", href: "#contact" }
];

interface SiteHeaderProps {
  content: ContentBundle;
  resumeAvailable: boolean;
}

export function SiteHeader({ content, resumeAvailable }: SiteHeaderProps) {
  const visibleProjects = sortProjectsByLatestPush(getVisibleProjects(content.projects));
  const [compressed, setCompressed] = useState(false);
  const sectionIds = useMemo(() => navItems.map((item) => item.href), []);
  const activeSection = useSectionVisibility(sectionIds);

  useEffect(() => {
    const update = () => setCompressed(window.scrollY > 36);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={`site-header${compressed ? " site-header-compressed" : ""}`}>
      <a className="site-brand" href="#top" aria-label="MUNEEB.SYSTEMS home">
        MUNEEB.SYSTEMS
      </a>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <a
            key={item.href}
            aria-current={activeSection === item.href ? "true" : undefined}
            href={item.href}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <QuickViewDialog
        experience={content.experience}
        profile={content.profile}
        projects={selectFeaturedProjects(visibleProjects)}
        resumeAvailable={resumeAvailable}
        skills={content.skills}
      />
      <MobileNavigation items={navItems} />
    </header>
  );
}
