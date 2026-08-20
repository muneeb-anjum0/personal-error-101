"use client";

import { useEffect, useMemo, useState } from "react";
import { useSectionVisibility } from "@/hooks/use-section-visibility";
import { MobileNavigation } from "./mobile-navigation";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { label: "ABOUT", href: "/#identity", section: "#identity" },
  { label: "EXPERIENCE", href: "/#experience", section: "#experience" },
  { label: "WORK", href: "/#projects", section: "#projects" },
  { label: "PHILOSOPHY", href: "/#philosophy", section: "#philosophy" }
];

export function SiteHeader() {
  const [compressed, setCompressed] = useState(false);
  const sectionIds = useMemo(() => navItems.map((item) => item.section), []);
  const activeSection = useSectionVisibility(sectionIds);

  useEffect(() => {
    const update = () => setCompressed(window.scrollY > 36);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={`site-header${compressed ? " site-header-compressed" : ""}`}>
      <a className="site-brand" href="/#top" aria-label="MUNEEB.SYSTEMS home">
        MUNEEB.SYSTEMS
      </a>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <a
            key={item.href}
            aria-current={activeSection === item.section ? "true" : undefined}
            href={item.href}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <ThemeToggle />
      <a className="nav-contact-action" href="/#contact">
        CONTACT
      </a>
      <MobileNavigation
        items={[
          ...navItems,
          { label: "CONTACT", href: "/#contact", section: "#contact" }
        ]}
      />
    </header>
  );
}
