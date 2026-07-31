import type { ContentBundle } from "@muneeb-systems/shared-types";
import {
  selectFeaturedProjects,
  sortProjectsByLatestPush,
  getVisibleProjects
} from "@/lib/portfolio-selectors";
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

  return (
    <header className="site-header">
      <a className="site-brand" href="#top" aria-label="MUNEEB.SYSTEMS home">
        MUNEEB.SYSTEMS
      </a>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <a key={item.href} href={item.href}>
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
