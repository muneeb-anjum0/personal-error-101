import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExperienceCaseStudy } from "@/components/experience/experience-case-study";
import { PageShell } from "@/components/layout/page-shell";
import { loadPortfolioContent } from "@/lib/content";

interface ExperiencePageProps {
  params: Promise<{ id: string }>;
}

const EMPTY_EXPERIENCE_BUILD_ID = "_no-experience-records";

export async function generateStaticParams() {
  const content = await loadPortfolioContent();
  return content.experience.length > 0
    ? content.experience.map((entry) => ({ id: entry.id }))
    : [{ id: EMPTY_EXPERIENCE_BUILD_ID }];
}

export async function generateMetadata({ params }: ExperiencePageProps): Promise<Metadata> {
  const { id } = await params;
  const content = await loadPortfolioContent();
  const entry = content.experience.find((experience) => experience.id === id);

  if (!entry) return { title: "Experience not found" };

  return {
    title: `${entry.role} / ${entry.organization}`,
    description: entry.summary
  };
}

export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const { id } = await params;
  const content = await loadPortfolioContent();
  const index = content.experience.findIndex((experience) => experience.id === id);
  const entry = content.experience[index];

  if (!entry) notFound();

  return (
    <PageShell>
      <ExperienceCaseStudy entry={entry} index={index} />
    </PageShell>
  );
}
