import { validatePortfolioContent } from "@/lib/content";

export async function GET() {
  await validatePortfolioContent();

  return Response.json({
    status: "healthy",
    services: {
      staticContent: true
    }
  });
}
