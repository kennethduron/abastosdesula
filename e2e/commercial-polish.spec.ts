import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/comerciantes",
  "/comerciantes/comercial-frutas-del-valle",
  "/productos",
  "/productos/tomate-saladette",
  "/promociones",
  "/noticias",
  "/noticias/guia-para-cotizar",
  "/contacto",
  "/acceso",
];

const internalLanguage =
  /\bdemo\b|demostrativ|firebase|\bpwa\b|\bmock\b|\bseed\b|\btenant\b|multitenant|admin sdk|emulator|staging|production config/i;

for (const route of publicRoutes) {
  test(`${route} uses commercial, customer-facing language`, async ({
    page,
  }) => {
    await page.goto(route);
    const visibleText = await page.locator("body").innerText();
    expect(visibleText).not.toMatch(internalLanguage);
  });
}

test("private access gates avoid implementation language", async ({ page }) => {
  for (const route of ["/panel", "/admin"]) {
    await page.goto(route);
    const visibleText = await page.locator("body").innerText();
    expect(visibleText).not.toMatch(internalLanguage);
  }
});

test("home publishes complete Open Graph and Twitter metadata", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Central de Abastos de Sula",
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    "Comerciantes, productos y cotizaciones en un solo lugar.",
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  const imageUrl = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  expect(imageUrl).toBeTruthy();
  const image = await request.get(new URL(imageUrl!).pathname);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toContain("image/png");
});
