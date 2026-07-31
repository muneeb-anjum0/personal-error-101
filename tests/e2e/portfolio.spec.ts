import { expect, test } from "@playwright/test";

test("portfolio boot page renders foundation status", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000");

  await expect(page.getByText("MUNEEB.SYSTEMS")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Foundation initialized." })).toBeVisible();
  await expect(page.getByText("Portfolio")).toBeVisible();
  await expect(page.getByText("Static content")).toBeVisible();
});
