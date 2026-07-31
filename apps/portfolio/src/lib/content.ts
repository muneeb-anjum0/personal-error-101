import { access } from "node:fs/promises";
import path from "node:path";
import { ContentEngine } from "@muneeb-systems/content-engine";

export function createPortfolioContentEngine(): ContentEngine {
  const dataDirectory = process.env.PORTFOLIO_DATA_DIR ?? path.resolve(process.cwd(), "../../data");

  return new ContentEngine({ dataDirectory });
}

export async function validatePortfolioContent(): Promise<void> {
  await createPortfolioContentEngine().loadBundle();
}

export async function loadPortfolioContent() {
  return createPortfolioContentEngine().loadBundle();
}

export async function isResumeAvailable(resumePath: string): Promise<boolean> {
  if (!resumePath.startsWith("/")) {
    return false;
  }

  try {
    await access(path.join(process.cwd(), "public", resumePath));
    return true;
  } catch {
    return false;
  }
}
