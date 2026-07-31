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
      github: true,
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
  await expect(
    (await request.get("http://127.0.0.1:4000/api/github/status")).json()
  ).resolves.toMatchObject({ authenticationState: "ANONYMOUS" });
  await expect(
    (await request.get("http://127.0.0.1:4000/api/github/repositories")).json()
  ).resolves.toHaveProperty("items");
  await expect(
    (await request.get("http://127.0.0.1:4000/api/ai/runtime")).json()
  ).resolves.toHaveProperty("processManagementAvailable");
  await expect(
    (await request.get("http://127.0.0.1:4000/api/queue")).json()
  ).resolves.toHaveProperty("jobs");
  await expect(
    (await request.get("http://127.0.0.1:4000/api/drafts")).json()
  ).resolves.toHaveProperty("items");
});
