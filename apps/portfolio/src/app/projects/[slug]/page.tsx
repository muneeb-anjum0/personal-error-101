import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { ProjectCaseStudy } from "@/components/projects/project-case-study";
import { isResumeAvailable, loadPortfolioContent } from "@/lib/content";
import {
  getVisibleProjects,
  selectAdjacentProjects,
  selectProjectBySlug,
  sortProjectsByLatestPush
} from "@/lib/portfolio-selectors";
import { serializeJsonLd } from "@/lib/serialize-json-ld";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

const EMPTY_PROJECTS_BUILD_SLUG = "_no-generated-projects";

export async function generateStaticParams() {
  const content = await loadPortfolioContent();
  const projects = getVisibleProjects(content.projects);

  // Next.js static export requires at least one parameter for a dynamic route.
  // The sentinel renders through notFound() and keeps an empty portfolio deployable.
  return projects.length > 0
    ? projects.map((project) => ({ slug: project.slug }))
    : [{ slug: EMPTY_PROJECTS_BUILD_SLUG }];
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = await loadPortfolioContent();
  const project = selectProjectBySlug(content.projects, slug);

  if (!project) {
    return { title: "Project not found" };
  }

  return {
    title: project.name,
    description: project.summary,
    openGraph: {
      title: project.name,
      description: project.summary,
      type: "article"
    }
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const content = await loadPortfolioContent();
  const project = selectProjectBySlug(content.projects, slug);

  if (!project) {
    notFound();
  }

  const visibleProjects = sortProjectsByLatestPush(getVisibleProjects(content.projects));
  const adjacent = selectAdjacentProjects(visibleProjects, project.slug);
  const resumeAvailable = await isResumeAvailable(content.profile.resumePath);

  return (
    <PageShell content={content} resumeAvailable={resumeAvailable}>
      <ProjectCaseStudy next={adjacent.next} previous={adjacent.previous} project={project} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            name: project.name,
            description: project.summary,
            programmingLanguage: project.technologies
          })
        }}
      />
    </PageShell>
  );
}
