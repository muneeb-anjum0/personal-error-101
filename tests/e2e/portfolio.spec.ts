import { expect, test } from "@playwright/test";

test("homepage loads the complete public portfolio", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000");

  await expect(page.getByRole("link", { name: "MUNEEB.SYSTEMS home" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /I BUILD/i })).toBeVisible();
  await expect(page.getByText("01 / IDENTITY")).toBeVisible();
  await expect(page.getByText("02 / CAPABILITIES")).toBeVisible();
  await expect(page.getByText("03 / EXPERIENCE")).toBeVisible();
  await expect(page.getByText("04 / SELECTED SYSTEMS")).toBeVisible();
  await expect(page.getByText("07 / CONTACT")).toBeVisible();
});

test("header navigation, quick view, and filters work on desktop", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000");

  await page.getByRole("link", { name: "WORK" }).click();
  await expect(page).toHaveURL(/#projects/);
  await page.getByRole("button", { name: "QUICK VIEW" }).click();
  await expect(page.getByRole("dialog", { name: "Quick View" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Quick View" })).toBeHidden();

  await page
    .getByLabel("Project filters")
    .getByRole("button", { name: "Machine Learning" })
    .click();
  await expect(page.getByRole("heading", { name: "Smart Electric Power Insights" })).toBeVisible();
});

test("mobile menu opens and closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:3000");

  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(page.getByRole("dialog", { name: "Mobile navigation" })).toBeVisible();
  await page.getByRole("link", { name: "CONTACT" }).click();
  await expect(page.getByRole("dialog", { name: "Mobile navigation" })).toBeHidden();
});

test("project detail route opens and page has no horizontal overflow", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000/projects/nope-security-orchestration");

  await expect(
    page.getByRole("heading", { name: "NOPE Security Orchestration Platform" })
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});
