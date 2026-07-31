import { expect, test } from "@playwright/test";

test("homepage loads the complete public portfolio", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000");

  await expect(page.getByRole("link", { name: "MUNEEB.SYSTEMS home" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /I BUILD/i })).toBeVisible();
  const main = page.getByRole("main");
  await expect(main.getByText("01 / IDENTITY").first()).toBeVisible();
  await expect(main.getByText("02 / CAPABILITIES").first()).toBeVisible();
  await expect(main.getByText("03 / EXPERIENCE").first()).toBeVisible();
  await expect(main.getByText("04 / SELECTED SYSTEMS").first()).toBeVisible();
  await expect(page.getByText("07 / CONTACT")).toBeVisible();
});

test("header navigation, quick view, and filters work on desktop", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000");

  await page.getByRole("link", { name: "WORK" }).click();
  await expect(page).toHaveURL(/#projects/);
  await expect(page.locator(".site-header")).toHaveClass(/site-header-compressed/);
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

test("engineering system supports pointer and keyboard interaction", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000");

  const node = page.getByLabel("AI node");
  await node.hover();
  await expect(page.locator(".engineering-system")).toContainText("AI LINK ACTIVE");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(node).toBeVisible();
});

test("mobile menu opens and closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:3000");

  await expect(page.locator(".custom-cursor")).toHaveCount(0);
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

test("reduced motion keeps content visible and disables cursor", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();

  await page.goto("http://127.0.0.1:3000");
  await expect(page.getByRole("heading", { name: /I BUILD/i })).toBeVisible();
  await expect(page.locator(".custom-cursor")).toHaveCount(0);
  await page.getByRole("button", { name: "QUICK VIEW" }).click();
  await expect(page.getByRole("dialog", { name: "Quick View" })).toBeVisible();

  await context.close();
});
