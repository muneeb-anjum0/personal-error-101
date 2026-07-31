import { PageShell } from "@/components/layout/page-shell";
import { ActivitySection } from "@/components/sections/activity-section/activity-section";
import { CapabilitySection } from "@/components/sections/capability-section/capability-section";
import { ContactSection } from "@/components/sections/contact-section/contact-section";
import { ExperienceSection } from "@/components/sections/experience-section/experience-section";
import { HeroSection } from "@/components/sections/hero-section/hero-section";
import { IdentitySection } from "@/components/sections/identity-section/identity-section";
import { PhilosophySection } from "@/components/sections/philosophy-section/philosophy-section";
import { ProjectsSection } from "@/components/sections/projects-section/projects-section";
import { isResumeAvailable, loadPortfolioContent } from "@/lib/content";
import { getVisibleProjects, sortProjectsByLatestPush } from "@/lib/portfolio-selectors";

export default async function HomePage() {
  const content = await loadPortfolioContent();
  const resumeAvailable = await isResumeAvailable(content.profile.resumePath);
  const projects = sortProjectsByLatestPush(getVisibleProjects(content.projects));

  return (
    <PageShell content={content} resumeAvailable={resumeAvailable}>
      <HeroSection profile={content.profile} resumeAvailable={resumeAvailable} />
      <IdentitySection content={content} />
      <CapabilitySection projects={projects} skills={content.skills} />
      <ExperienceSection entries={content.experience} />
      <ProjectsSection profile={content.profile} projects={projects} />
      <ActivitySection activity={content.activity} />
      <PhilosophySection profile={content.profile} />
      <ContactSection profile={content.profile} resumeAvailable={resumeAvailable} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: content.profile.name,
            url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
            sameAs: [content.profile.githubUrl, content.profile.linkedInUrl],
            jobTitle: "Full-stack developer"
          })
        }}
      />
    </PageShell>
  );
}
