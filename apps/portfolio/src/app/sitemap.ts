import type { MetadataRoute } from "next";
import { loadPortfolioContent } from "@/lib/content";
import { getVisibleProjects } from "@/lib/portfolio-selectors";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const content = await loadPortfolioContent();

  return [
    {
      url: siteUrl,
      lastModified: new Date()
    },
    ...getVisibleProjects(content.projects).map((project) => ({
      url: `${siteUrl}/projects/${project.slug}`,
      lastModified: project.pushedAt ? new Date(project.pushedAt) : new Date()
    })),
    ...content.experience.map((entry) => ({
      url: `${siteUrl}/experience/${entry.id}`,
      lastModified: new Date()
    }))
  ];
}
