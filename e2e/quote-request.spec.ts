import { expect, test, type Page } from "@playwright/test";

const profileUrl = "/comerciantes/comercial-frutas-del-valle";

async function openCleanQuoteFlow(page: Page) {
  await page.goto(profileUrl);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page
    .getByTestId("catalog-product")
    .first()
    .getByRole("button", { name: "Agregar" })
    .click();
}

test("public customer creates a validated demo quote request", async ({
  page,
}) => {
  await openCleanQuoteFlow(page);
  const cart = page.getByRole("dialog", { name: "Tu solicitud" });

  await cart.getByLabel("Nombre completo").fill("Restaurante Demo Sula");
  await cart.getByLabel("Tipo de cliente").selectOption("restaurant");
  await cart.getByLabel("Teléfono").fill("99990000");
  await cart.getByLabel("Modalidad").selectOption("coordinate");
  await cart
    .getByLabel("Observaciones (opcional)")
    .fill("Cotizar para la próxima semana.");
  await cart.getByRole("button", { name: "Enviar solicitud demo" }).click();

  await expect(page.getByTestId("quote-confirmation")).toBeVisible();
  await expect(page.getByText("Solicitud demo recibida")).toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("abastos-demo-quotes-v1") ?? "[]"),
  );
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({
    businessId: "business-frutas-valle",
    customerName: "Restaurante Demo Sula",
    customerType: "restaurant",
    status: "new",
  });
  expect(stored[0].items).toHaveLength(1);
});

test("quote form blocks incomplete customer data", async ({ page }) => {
  await openCleanQuoteFlow(page);
  const cart = page.getByRole("dialog", { name: "Tu solicitud" });

  await cart.getByRole("button", { name: "Enviar solicitud demo" }).click();

  await expect(page.getByTestId("quote-confirmation")).toHaveCount(0);
  await expect(cart.getByLabel("Nombre completo")).toBeFocused();
});

test("captures the completed quote flow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openCleanQuoteFlow(page);
  const cart = page.getByRole("dialog", { name: "Tu solicitud" });
  await cart.getByLabel("Nombre completo").fill("Cliente Demo");
  await cart.getByLabel("Teléfono").fill("99990000");
  await cart.getByRole("button", { name: "Enviar solicitud demo" }).click();
  await expect(page.getByTestId("quote-confirmation")).toBeVisible();
  await page.screenshot({
    path: "artifacts/cart/quote-confirmation-390x844.png",
    fullPage: false,
  });
});
