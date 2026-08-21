import { expect, test } from "@playwright/test";

test("the application responds successfully", async ({ request }) => {
  const response = await request.get("/");

  expect(response.ok()).toBe(true);
});
