import { expect, test } from "@playwright/test";

test("generator UI dashboard routes work", async ({ page }) => {
  await page.goto("http://127.0.0.1:4173");

  await expect(page.getByRole("heading", { name: "MUNEEB.SYSTEMS GENERATOR" })).toBeVisible();
  await expect(page.getByText("Generator API")).toBeVisible();

  await page.getByRole("button", { name: "REPOSITORIES" }).click();
  await expect(page.getByRole("heading", { name: "GitHub repository discovery" })).toBeVisible();
  await expect(page.getByText("PUBLIC REPOSITORIES ONLY /", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "QUEUE", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sequential AI processing queue" })).toBeVisible();
  await expect(page.getByRole("button", { name: "ADD SELECTED" })).toBeVisible();

  await page.getByRole("button", { name: "LOCAL AI" }).click();
  await expect(page.getByRole("heading", { name: "Local Qwen runtime" })).toBeVisible();
  await expect(page.getByRole("button", { name: "CHECK ENDPOINT" })).toBeVisible();

  await page.getByRole("button", { name: "CONTENT" }).click();
  await expect(page.getByRole("heading", { name: "Static Content Inspection" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Projects VALID data\/projects\.json/ })
  ).toBeVisible();

  await page.getByRole("button", { name: "SETTINGS" }).click();
  await expect(page.getByRole("heading", { name: "Safe Local Preferences" })).toBeVisible();

  await page.getByRole("button", { name: "LOGS" }).click();
  await expect(page.getByRole("heading", { name: "Structured Application Logs" })).toBeVisible();

  await page.getByRole("button", { name: "SYSTEM" }).click();
  await expect(page.getByRole("heading", { name: "Local Runtime Information" })).toBeVisible();
});

test("generator mobile navigation works without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4173");

  await page.getByRole("button", { name: "MENU" }).click();
  await expect(page.getByRole("dialog", { name: "Generator navigation" })).toBeVisible();
  await page.getByRole("button", { name: "REPOSITORIES" }).click();
  await expect(page.getByRole("heading", { name: "GitHub repository discovery" })).toBeVisible();
  await page.getByRole("button", { name: "MENU" }).click();
  await page.getByRole("button", { name: "QUEUE", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sequential AI processing queue" })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});
