import type { FastifyInstance } from "fastify";

export function registerPortfolioDeploymentRoutes(app: FastifyInstance): void {
  app.get("/api/portfolio-deployment", () => app.portfolioDeploymentService.status());
  app.post("/api/portfolio-deployment", () => app.portfolioDeploymentService.start());
}
