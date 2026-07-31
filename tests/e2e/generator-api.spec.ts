import { expect, test } from "@playwright/test";

test("generator health endpoint reports healthy", async ({ request }) => {
  const response = await request.get("http://127.0.0.1:4000/health");

  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toEqual({ status: "healthy" });
});

test("generator readiness endpoint reports placeholder services", async ({ request }) => {
  const response = await request.get("http://127.0.0.1:4000/ready");

  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toMatchObject({
    status: "ready",
    services: {
      filesystem: true,
      content: true,
      settings: true,
      github: false,
      publishing: false
    }
  });
});

test("generator dashboard and content endpoints respond", async ({ request }) => {
  await expect(
    (await request.get("http://127.0.0.1:4000/api/dashboard")).json()
  ).resolves.toHaveProperty("application");
  await expect(
    (await request.get("http://127.0.0.1:4000/api/content/status")).json()
  ).resolves.toHaveProperty("files");
});
