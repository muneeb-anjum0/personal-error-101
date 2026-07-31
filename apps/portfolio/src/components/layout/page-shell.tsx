import type { ContentBundle } from "@muneeb-systems/shared-types";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

interface PageShellProps {
  content: ContentBundle;
  resumeAvailable: boolean;
  children: React.ReactNode;
}

export function PageShell({ content, resumeAvailable, children }: PageShellProps) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader content={content} resumeAvailable={resumeAvailable} />
      <main id="main">{children}</main>
      <SiteFooter profile={content.profile} />
    </>
  );
}
