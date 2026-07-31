import path from "node:path";
import { ContentEngine } from "@muneeb-systems/content-engine";

export function createPortfolioContentEngine(): ContentEngine {
  const dataDirectory = process.env.PORTFOLIO_DATA_DIR ?? path.resolve(process.cwd(), "../../data");

  return new ContentEngine({ dataDirectory });
}

export async function validatePortfolioContent(): Promise<void> {
  await createPortfolioContentEngine().loadBundle();
}
