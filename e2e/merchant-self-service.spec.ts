import { expect, test } from "@playwright/test";

const artifactDir = "artifacts/merchant-self-service-audit";

async function completeRegistration(page: import("@playwright/test").Page) {
  await page.getByLabel("Nombre del responsable").fill("María Comerciante");
  await page.getByLabel("Correo electrónico").fill("maria@example.com");
  await page.getByLabel("Teléfono").fill("+504 9999-0000");
  await page
    .getByRole("textbox", { name: "WhatsApp", exact: true })
    .fill("+504 9999-0000");
  await page.getByLabel("Nombre comercial").fill("Productos del Mercado");
  await page.getByLabel("Categoría").selectOption("category-groceries");
  await page.getByLabel("Local o puesto (opcional)").fill("Local B-14");
  await page.getByLabel("Contraseña", { exact: true }).fill("Comercio2026");
  await page.getByLabel("Confirmar contraseña").fill("Comercio2026");
  await page.getByRole("checkbox").check();
}

test("public merchant registration is validated and ends in controlled pending state", async ({
  page,
}) => {
  await page.route("**/api/merchant-applications", async (route) => {
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    expect(payload).not.toHaveProperty("role");
    expect(payload.businessName).toBe("Productos del Mercado");
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ received: true }),
    });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/registro-comerciante");
  await expect(
    page.getByRole("heading", { name: "Solicita acceso para tu negocio" }),
  ).toBeVisible();
  await completeRegistration(page);
  await page.screenshot({
    path: `${artifactDir}/merchant-registration-1440.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Solicitar acceso" }).click();
  await expect(page).toHaveURL(/solicitud-recibida/);
  await expect(
    page.getByRole("heading", { name: "Solicitud recibida" }),
  ).toBeVisible();
  await page.screenshot({
    path: `${artifactDir}/registration-pending-1440.png`,
    fullPage: true,
  });
});

test("registration stays usable at 390 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/registro-comerciante");
  await expect(page.getByLabel("Nombre del responsable")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: `${artifactDir}/registration-390.png`,
    fullPage: true,
  });
});

test("local administration exposes access review as read-only safe fallback", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Entrar a administración" }).click();
  await expect(
    page.getByRole("heading", { name: "Solicitudes de acceso" }),
  ).toBeVisible();
  await page.screenshot({
    path: `${artifactDir}/admin-access-requests-1440.png`,
    fullPage: true,
  });
});
