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
      github: false,
      ai: false
    }
  });
});
