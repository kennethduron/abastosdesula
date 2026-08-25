import { expect, test, type Page } from "@playwright/test";

const enabled = process.env.PLAYWRIGHT_MERCHANT_SELF_SERVICE_E2E === "true";
const merchant = {
  email: process.env.DEMO_MERCHANT_EMAIL ?? "",
  password: process.env.DEMO_MERCHANT_PASSWORD ?? "",
};
const artifactDir = "artifacts/merchant-self-service-audit";

test.skip(
  !enabled || !merchant.email || !merchant.password,
  "Requires the isolated Firebase emulator fixture.",
);

async function login(
  page: Page,
  credentials: { email: string; password: string } = merchant,
) {
  await page.goto("/acceso");
  await page.getByLabel("Correo electrónico").fill(credentials.email);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(credentials.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

async function selectDesktopSection(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Navegación del panel" })
    .getByRole("button", { name, exact: true })
    .click();
}

async function selectMobileSection(page: Page, name: string) {
  await page.getByRole("button", { name: "Abrir navegación" }).click();
  await page
    .getByRole("navigation", { name: "Navegación del panel" })
    .getByRole("button", { name, exact: true })
    .click();
}

test("merchant product lifecycle reaches the public marketplace and CRM", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const suffix = Date.now().toString().slice(-7);
  const productName = `Canasta Portal ${suffix}`;
  const customerName = `Cliente Portal ${suffix}`;

  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });
  await expect(
    page.getByRole("heading", { name: "Resumen general" }),
  ).toBeVisible();
  await page.screenshot({
    path: `${artifactDir}/merchant-dashboard-1440.png`,
    fullPage: true,
  });

  await selectDesktopSection(page, "Mi negocio");
  await expect(page.getByRole("heading", { name: "Mi negocio" })).toBeVisible();
  await page.screenshot({
    path: `${artifactDir}/merchant-my-business-1440.png`,
    fullPage: true,
  });

  await selectDesktopSection(page, "Productos");
  await expect(page.getByRole("heading", { name: "Productos" })).toBeVisible();
  await page.screenshot({
    path: `${artifactDir}/merchant-products-1440.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await page.screenshot({
    path: `${artifactDir}/merchant-product-create-1440.png`,
    fullPage: true,
  });
  const form = page.locator("form").filter({ hasText: "Guardar" }).last();
  await form.getByLabel("Nombre").fill(productName);
  await form
    .getByLabel("Descripción")
    .fill("Canasta fresca preparada por el comerciante para cotización.");
  await form.getByLabel("Categoría").selectOption("category-groceries");
  await form.getByLabel("Precio (L)").fill("31.75");
  await form.getByLabel("Unidad / presentación").fill("canasta");
  await form.getByLabel("SKU interno (opcional)").fill(`PORTAL-${suffix}`);
  await form.getByLabel("Existencia").fill("4");
  await form.getByLabel("Stock mínimo").fill("3");
  await form.getByLabel("Publicado").check();
  await form.getByRole("button", { name: "Guardar" }).click();
  await expect(
    page.getByText("Producto guardado correctamente."),
  ).toBeVisible();
  await expect(page.getByText(productName)).toBeVisible();

  await selectDesktopSection(page, "Inventario");
  await expect(page.getByRole("heading", { name: "Inventario" })).toBeVisible();
  const inventoryRow = page.locator("article").filter({ hasText: productName });
  await inventoryRow.getByRole("button", { name: "Movimiento" }).click();
  const movementForm = page.locator("form").filter({ hasText: productName });
  await movementForm.getByLabel("Tipo").selectOption("entry");
  await movementForm.getByLabel("Cantidad").fill("6");
  await movementForm
    .getByLabel("Motivo")
    .fill("Ingreso de auditoría comercial");
  await page.screenshot({
    path: `${artifactDir}/merchant-inventory-1440.png`,
    fullPage: true,
  });
  await movementForm.getByRole("button", { name: "Registrar" }).click();
  await expect(page.getByText("Movimiento registrado.")).toBeVisible();
  await expect(inventoryRow.getByText("10 canasta")).toBeVisible();

  await selectDesktopSection(page, "Estado de cuenta");
  await expect(
    page.getByRole("heading", {
      name: /Estado de cuenta|Mi cuenta con la Central/,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: `${artifactDir}/merchant-account-1440.png`,
    fullPage: true,
  });

  await page.goto("/productos");
  await expect(page.getByText(productName)).toBeVisible();
  const productCard = page.locator("article").filter({ hasText: productName });
  await expect(productCard.getByText("L 31.75")).toBeVisible();
  await page.screenshot({
    path: `${artifactDir}/public-new-product-1440.png`,
    fullPage: true,
  });
  await productCard.getByRole("link").click();
  await page.getByRole("link", { name: "Ver comerciante y cotizar" }).click();
  await page
    .getByTestId("catalog-product")
    .filter({ hasText: productName })
    .getByRole("button", { name: "Agregar" })
    .click();
  const cart = page.getByRole("dialog", { name: "Tu solicitud" });
  await cart.getByLabel("Nombre completo").fill(customerName);
  await cart.getByLabel("Tipo de cliente").selectOption("business");
  await cart.getByLabel("Teléfono").fill("99990000");
  await cart.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(page.getByTestId("quote-confirmation")).toBeVisible();

  await page.goto("/panel");
  await expect(page.getByText(customerName).first()).toBeVisible();
  await selectDesktopSection(page, "Productos");
  const privateCard = page.locator("article").filter({ hasText: productName });
  await privateCard.getByRole("button", { name: "Editar" }).click();
  const editForm = page.locator("form").filter({ hasText: "Guardar" }).last();
  await editForm.getByLabel("Precio (L)").fill("38.50");
  await editForm.getByRole("button", { name: "Guardar" }).click();
  await expect(
    page.getByText("Producto guardado correctamente."),
  ).toBeVisible();
  await page.goto("/productos");
  await expect(
    page
      .locator("article")
      .filter({ hasText: productName })
      .getByText("L 38.50"),
  ).toBeVisible();

  await page.goto("/panel");
  await selectDesktopSection(page, "Productos");
  await page
    .locator("article")
    .filter({ hasText: productName })
    .getByRole("button", { name: "Ocultar" })
    .click();
  await expect(
    page
      .locator("article")
      .filter({ hasText: productName })
      .getByText("Oculto"),
  ).toBeVisible();
  await page.goto("/productos");
  await expect
    .poll(
      async () => {
        await page.reload();
        return page.getByText(productName).count();
      },
      { timeout: 15_000 },
    )
    .toBe(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/panel");
  await selectMobileSection(page, "Mi negocio");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: `${artifactDir}/merchant-business-390.png`,
    fullPage: true,
  });
  await selectMobileSection(page, "Productos");
  await page.screenshot({
    path: `${artifactDir}/merchant-products-390.png`,
    fullPage: true,
  });
  await selectMobileSection(page, "Inventario");
  await page.screenshot({
    path: `${artifactDir}/inventory-390.png`,
    fullPage: true,
  });
});

test("applicant remains isolated until an institutional administrator approves access", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const suffix = Date.now().toString().slice(-7);
  const applicant = {
    email: `aspirante-${suffix}@example.com`,
    password: `Aspirante${suffix}X`,
  };
  const businessName = `Mercado Aspirante ${suffix}`;

  await page.goto("/registro-comerciante");
  await page.getByLabel("Nombre del responsable").fill("Ana Aspirante");
  await page.getByLabel("Correo electrónico").fill(applicant.email);
  await page.getByLabel("Teléfono").fill("99887766");
  await page.getByRole("textbox", { name: "WhatsApp" }).fill("99887766");
  await page.getByLabel("Nombre comercial").fill(businessName);
  await page.getByLabel("Categoría").selectOption("category-fruits");
  await page.getByLabel("Local o puesto (opcional)").fill("Puesto A-12");
  await page.getByLabel("Contraseña", { exact: true }).fill(applicant.password);
  await page.getByLabel("Confirmar contraseña").fill(applicant.password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Solicitar acceso" }).click();
  await expect(page).toHaveURL(/\/solicitud-recibida$/, {
    timeout: 15_000,
  });

  await login(page, applicant);
  await expect(page).toHaveURL(/\/solicitud-recibida$/, {
    timeout: 15_000,
  });
  await page.goto("/panel");
  await expect(page).toHaveURL(/\/solicitud-recibida$/);
  await page.goto("/admin");
  await expect(page).not.toHaveURL(/\/admin$/);

  await page.request.delete("/api/auth/session");
  await login(page, {
    email: process.env.DEMO_ADMIN_EMAIL ?? "",
    password: process.env.DEMO_ADMIN_PASSWORD ?? "",
  });
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 });
  const application = page.locator("li").filter({ hasText: businessName });
  await expect(application).toBeVisible();
  await application.getByRole("button", { name: "Aprobar" }).click();
  await expect(application.getByText("Aprobada")).toBeVisible({
    timeout: 15_000,
  });

  await page.request.delete("/api/auth/session");
  await login(page, applicant);
  await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });
  await expect(
    page.getByRole("heading", { name: "Resumen general" }),
  ).toBeVisible();
});

test("central-created account must replace its one-time password", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const suffix = Date.now().toString().slice(-7);
  const directEmail = `central-${suffix}@example.com`;
  const replacementPassword = `Renovada${suffix}X`;

  await login(page, {
    email: process.env.DEMO_ADMIN_EMAIL ?? "",
    password: process.env.DEMO_ADMIN_PASSWORD ?? "",
  });
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 });
  await page.getByRole("button", { name: "Crear acceso" }).click();
  const createForm = page.locator("form").filter({ hasText: "Generar cuenta" });
  await createForm.getByLabel("Responsable").fill("Carlos Central");
  await createForm.getByLabel("Correo").fill(directEmail);
  await createForm.getByLabel("Teléfono").fill("99776655");
  await createForm.getByLabel("Negocio").fill(`Negocio Central ${suffix}`);
  await createForm.getByLabel("Local / puesto").fill("Local C-4");
  await createForm.getByLabel("Categoría").selectOption("category-groceries");
  const createResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin/merchants") &&
      response.request().method() === "POST",
  );
  await createForm.getByRole("button", { name: "Generar cuenta" }).click();
  const response = await createResponse;
  expect(response.ok()).toBeTruthy();
  const result = (await response.json()) as { temporaryPassword?: string };
  expect(result.temporaryPassword).toBeTruthy();
  await expect(
    page.getByText("Contraseña temporal (se muestra una sola vez):"),
  ).toBeVisible();

  await page.request.delete("/api/auth/session");
  await login(page, {
    email: directEmail,
    password: result.temporaryPassword as string,
  });
  await expect(page).toHaveURL(/\/cambiar-contrasena$/, {
    timeout: 15_000,
  });
  await page.getByLabel("Nueva contraseña").fill(replacementPassword);
  await page.getByLabel("Confirmar contraseña").fill(replacementPassword);
  await page.getByRole("button", { name: "Establecer contraseña" }).click();
  await expect(page).toHaveURL(/\/acceso\?passwordChanged=1$/, {
    timeout: 15_000,
  });
  await login(page, { email: directEmail, password: replacementPassword });
  await expect(page).toHaveURL(/\/panel$/, { timeout: 15_000 });
});
