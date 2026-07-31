import { expect, test } from "@playwright/test";

test("generator UI displays backend health state", async ({ page }) => {
  await page.goto("http://127.0.0.1:4173");

  await expect(page.getByRole("heading", { name: "Portfolio Generator" })).toBeVisible();
  await expect(page.getByText("Backend Status")).toBeVisible();
  await expect(page.getByText("Healthy")).toBeVisible();
  await expect(page.getByText("GitHub")).toBeVisible();
  await expect(page.getByText("AI Model")).toBeVisible();
  await expect(page.getByText("Content Storage")).toBeVisible();
});
