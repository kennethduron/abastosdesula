import { expect, test, type Page } from "@playwright/test";

const auditViewports = [
  { name: "375x812", width: 375, height: 812, screenshot: true },
  { name: "390x844", width: 390, height: 844, screenshot: true },
  { name: "430x932", width: 430, height: 932, screenshot: true },
  { name: "768x1024", width: 768, height: 1024, screenshot: true },
  { name: "1024x768", width: 1024, height: 768, screenshot: true },
  { name: "1280x800", width: 1280, height: 800, screenshot: false },
  { name: "1440x900", width: 1440, height: 900, screenshot: true },
  { name: "1920x1080", width: 1920, height: 1080, screenshot: true },
] as const;

async function loadLazyImages(page: Page) {
  const pageHeight = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );

  for (let position = 0; position < pageHeight; position += 700) {
    await page.evaluate((top) => window.scrollTo({ top }), position);
    await page.waitForTimeout(40);
  }

  await page.waitForFunction(
    () =>
      [...document.images].every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    { timeout: 10_000 },
  );
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.waitForTimeout(300);
}

test("the public home exposes its primary structure", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(
    "Central de Abastos de Sula | Productos y Comerciantes",
  );
  await expect(page.getByTestId("public-header")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Productos frescos, comerciantes de confianza/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Navegación principal" }),
  ).toBeAttached();
  await expect(
    page.getByRole("heading", { name: "Explora por categoría" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Comerciantes destacados" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Productos de temporada" }),
  ).toBeVisible();
  await expect(page.getByTestId("quote-cta")).toContainText(
    "Solicitar cotización",
  );
  await expect(page.getByTestId("public-footer")).toBeVisible();

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("the mobile menu is keyboard accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: "Abrir menú principal" });
  await expect(menuButton).toBeVisible();
  await expect(menuButton).toBeEnabled();
  await menuButton.click();

  const mobileNavigation = page.getByRole("navigation", {
    name: "Navegación móvil",
  });
  await expect(mobileNavigation).toBeVisible();
  await expect(
    mobileNavigation.getByRole("link", { name: "Comerciantes", exact: true }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("navigation", { name: "Navegación móvil" }),
  ).toHaveCount(0);
});

for (const viewport of auditViewports) {
  test(`home has no horizontal overflow at ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto("/");
    await page.locator("main").waitFor();

    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    expect(
      dimensions.scrollWidth,
      `scrollWidth at ${viewport.name}`,
    ).toBeLessThanOrEqual(dimensions.innerWidth);

    if (viewport.screenshot) {
      await loadLazyImages(page);
      await page.screenshot({
        path: `artifacts/home-audit/home-${viewport.name}.png`,
        fullPage: true,
      });
    }
  });
}
