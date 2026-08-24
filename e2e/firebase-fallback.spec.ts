import { expect, test } from "@playwright/test";

test("access page exposes a safe local fallback without Firebase secrets", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/acceso");

  await expect(
    page.getByRole("heading", { name: "Ingresa a tu cuenta" }),
  ).toBeVisible();
  await expect(
    page.getByText("Servicio de acceso temporalmente no disponible"),
  ).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  expect(scrollWidth).toBeLessThanOrEqual(390);
  expect(errors).toEqual([]);

  await page.screenshot({
    path: "artifacts/firebase/access-fallback-390x844.png",
    fullPage: true,
  });
});

test("server endpoints fail closed when Firebase Admin is unavailable", async ({
  request,
}) => {
  const session = await request.post("/api/auth/session", {
    data: { idToken: "not-a-real-token" },
  });
  expect(session.status()).toBe(503);
  await expect(session.json()).resolves.toEqual({
    error: "Servicio temporalmente no disponible.",
  });

  const quote = await request.post("/api/quote-requests", {
    data: { businessId: "business-frutas-valle" },
  });
  expect(quote.status()).toBe(503);
  await expect(quote.json()).resolves.toEqual({
    error: "Servicio temporalmente no disponible.",
  });
});
