import { validatePortfolioContent } from "@/lib/content";

export const dynamic = "force-static";

export async function GET() {
  await validatePortfolioContent();

  return Response.json({
    status: "healthy",
    services: {
      staticContent: true
    }
  });
}
