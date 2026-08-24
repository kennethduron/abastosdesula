import { expect, test, type Page } from "@playwright/test";

async function openCleanPanel(page: Page) {
  await page.goto("/panel");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
}

async function enterBusiness(page: Page, businessId = "business-frutas-valle") {
  await page.getByLabel("Comerciante demo").selectOption(businessId);
  await page.getByRole("button", { name: "Entrar al panel demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Resumen general" }),
  ).toBeVisible();
}

test("demo access gate opens a persistent merchant session", async ({
  page,
}) => {
  await openCleanPanel(page);
  await expect(page.getByText("Acceso local de demostración")).toBeVisible();
  await enterBusiness(page);
  await expect(
    page.getByText("Comercial Frutas del Valle").first(),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Resumen general" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Restaurante El Buen Sabor/ }),
  ).toBeVisible();
});

test("a public quote appears in the matching merchant CRM", async ({
  page,
}) => {
  await page.goto("/comerciantes/comercial-frutas-del-valle");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page
    .getByTestId("catalog-product")
    .first()
    .getByRole("button", { name: "Agregar" })
    .click();
  const cart = page.getByRole("dialog", { name: "Tu solicitud" });
  await cart.getByLabel("Nombre completo").fill("Cliente Integración CRM");
  await cart.getByLabel("Teléfono").fill("99990000");
  await cart.getByRole("button", { name: "Enviar solicitud demo" }).click();
  await expect(page.getByTestId("quote-confirmation")).toBeVisible();

  await page.goto("/panel");
  await enterBusiness(page);
  await expect(
    page.getByRole("button", { name: /Cliente Integración CRM/ }),
  ).toBeVisible();
  await expect(page.getByText("Cliente aislado La Huerta")).toHaveCount(0);
});

test("merchant can inspect a request and persist its status", async ({
  page,
}) => {
  await openCleanPanel(page);
  await enterBusiness(page);

  await page.getByRole("button", { name: /Restaurante El Buen Sabor/ }).click();
  const dialog = page.getByRole("dialog", { name: "Detalle de solicitud" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Estado de la solicitud").selectOption("confirmed");
  await expect(dialog.getByLabel("Estado de la solicitud")).toHaveValue(
    "confirmed",
  );

  await page.reload();
  await page.getByRole("button", { name: /Restaurante El Buen Sabor/ }).click();
  await expect(
    page.getByRole("dialog").getByLabel("Estado de la solicitud"),
  ).toHaveValue("confirmed");
});

test("business isolation hides requests from other merchants", async ({
  page,
}) => {
  await openCleanPanel(page);
  await enterBusiness(page);
  await expect(page.getByText("Cliente aislado La Huerta")).toHaveCount(0);

  await page
    .getByRole("button", { name: "Cerrar sesión demo" })
    .first()
    .click();
  await enterBusiness(page, "business-la-huerta");
  await expect(
    page.getByRole("button", { name: /Cliente aislado La Huerta/ }),
  ).toBeVisible();
  await expect(page.getByText("Restaurante El Buen Sabor")).toHaveCount(0);
});

test("dashboard remains error-free without horizontal overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await openCleanPanel(page);
  await enterBusiness(page);
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(
      page.getByRole("heading", { name: "Resumen general" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: /Restaurante El Buen Sabor/ })
      .click();
    const detail = page.getByRole("dialog", { name: "Detalle de solicitud" });
    await expect(detail).toBeVisible();
    await page.waitForTimeout(350);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await detail.getByRole("button", { name: "Cerrar detalle" }).click();
  }
  expect(errors).toEqual([]);
});

test("captures the responsive dashboard matrix", async ({ page }) => {
  await openCleanPanel(page);
  await enterBusiness(page);
  const viewports = [
    [375, 812],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1024, 768],
    [1280, 800],
    [1440, 900],
    [1920, 1080],
  ] as const;

  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.screenshot({
      path: `artifacts/merchant-dashboard-crm/dashboard-${width}x${height}.png`,
      fullPage: true,
    });
  }
});
