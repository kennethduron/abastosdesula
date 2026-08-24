import { expect, test, type Page } from "@playwright/test";

async function openCleanPanel(page: Page) {
  await page.goto("/panel");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
}

async function enterBusiness(page: Page, businessId = "business-frutas-valle") {
  await page.getByLabel("Comerciante").selectOption(businessId);
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await expect(
    page.getByRole("heading", { name: "Resumen general" }),
  ).toBeVisible();
}

async function openSeedRequest(page: Page) {
  await page.getByRole("button", { name: /Restaurante El Buen Sabor/ }).click();
  return page.getByRole("dialog", { name: "Detalle de solicitud" });
}

test("cart items do not create a CRM request until the customer submits", async ({
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

  await page.goto("/panel");
  await enterBusiness(page);
  await page.getByRole("button", { name: "Solicitudes" }).first().click();
  await page
    .getByPlaceholder("Cliente, teléfono, referencia o empresa")
    .fill("Cliente sin enviar");
  await expect(page.getByText("Cliente sin enviar")).toHaveCount(0);
});

test("submitted cart request can be fully managed and remains tenant isolated", async ({
  page,
}) => {
  const customerName = `Cliente Auditoría CRM ${Date.now()}`;
  await page.goto("/comerciantes/comercial-frutas-del-valle");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  const products = page.getByTestId("catalog-product");
  await products.nth(0).getByRole("button", { name: "Agregar" }).click();
  await page
    .getByRole("dialog", { name: "Tu solicitud" })
    .getByLabel("Cerrar carrito")
    .click();
  await products.nth(1).getByRole("button", { name: "Agregar" }).click();
  const cart = page.getByRole("dialog", { name: "Tu solicitud" });
  await cart.getByLabel("Nombre completo").fill(customerName);
  await cart.getByLabel("Empresa (opcional)").fill("Restaurante Auditoría");
  await cart.getByLabel("Tipo de cliente").selectOption("restaurant");
  await cart.getByLabel("Teléfono").fill("99990000");
  await cart.getByLabel("WhatsApp (opcional)").fill("99990000");
  await cart.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(page.getByTestId("quote-confirmation")).toBeVisible();

  await page.goto("/panel");
  await enterBusiness(page);
  await expect(
    page.getByRole("button", { name: new RegExp(customerName) }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: new RegExp(`^${customerName}, SOL-`) })
    .click();
  const detail = page.getByRole("dialog", { name: "Detalle de solicitud" });
  await detail
    .getByLabel("Nueva nota interna")
    .fill("Solicitó precio especial por volumen.");
  await detail.getByRole("button", { name: "Agregar nota" }).click();
  await expect(
    detail.getByText("Solicitó precio especial por volumen."),
  ).toBeVisible();
  await detail.getByLabel("Título").fill("Llamar para confirmar pedido");
  await detail.getByLabel("Fecha").fill("2026-08-25");
  await detail.getByLabel("Hora (opcional)").fill("10:30");
  await detail.getByRole("button", { name: "Programar seguimiento" }).click();
  await expect(detail.getByText("Llamar para confirmar pedido")).toBeVisible();
  await detail.getByLabel("Estado de la solicitud").selectOption("in_review");
  await detail.getByRole("tab", { name: "Cotización" }).click();
  await detail.getByLabel("Precio de Tomate Saladette").fill("11.50");
  await detail.getByLabel("Precio de Sandía").fill("5.75");
  await detail.getByLabel("Descuento de la cotización").fill("5.00");
  await detail.getByRole("button", { name: "Guardar cotización" }).click();
  await detail.getByRole("tab", { name: "Solicitud" }).click();
  await detail.getByLabel("Estado de la solicitud").selectOption("quoted");
  await detail.getByRole("button", { name: "Cerrar detalle" }).click();

  await page.reload();
  await page
    .getByRole("button", { name: new RegExp(`^${customerName}, SOL-`) })
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "Detalle de solicitud" })
      .getByText("Solicitó precio especial por volumen."),
  ).toBeVisible();
  await page
    .getByRole("dialog", { name: "Detalle de solicitud" })
    .getByRole("button", { name: "Cerrar detalle" })
    .click();
  await page.getByRole("button", { name: "Clientes" }).first().click();
  await expect(
    page.getByRole("button", { name: new RegExp(customerName) }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).first().click();
  await enterBusiness(page, "business-la-huerta");
  await page.getByRole("button", { name: "Solicitudes" }).first().click();
  await expect(page.getByText(customerName)).toHaveCount(0);
});

test("manual requests are validated and join the same CRM", async ({
  page,
}) => {
  await openCleanPanel(page);
  await enterBusiness(page);
  await page.getByRole("button", { name: "Nueva solicitud" }).click();
  const dialog = page.getByRole("dialog", { name: "Nueva solicitud" });
  await dialog.getByRole("button", { name: "Nuevo cliente" }).click();
  await dialog.getByLabel("Nombre").fill("Cliente Manual QA");
  await dialog.getByLabel("Empresa (opcional)").fill("Comedor Manual");
  await dialog.getByLabel("Teléfono", { exact: true }).fill("99887766");
  await dialog.getByLabel("Origen").selectOption("phone");
  await dialog.getByLabel("Cantidad").fill("8");
  await dialog.getByRole("button", { name: "Guardar solicitud" }).click();
  await page.getByRole("button", { name: "Solicitudes" }).first().click();
  await expect(
    page.getByRole("button", { name: /Cliente Manual QA/ }),
  ).toBeVisible();
});

test("advanced CRM stays within the viewport at every required resolution", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await openCleanPanel(page);
  await enterBusiness(page);
  const viewports = [
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const navigation = page.getByRole("navigation", {
      name:
        viewport.width < 1024 ? "Navegación inferior" : "Navegación del panel",
    });
    await navigation.getByRole("button", { name: "Solicitudes" }).click();
    const listWidth = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      offenders: [...document.body.querySelectorAll("*")]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            element: `${element.tagName.toLowerCase()}.${element.className}`,
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        })
        .filter((element) => element.right > window.innerWidth + 1)
        .sort((a, b) => b.right - a.right)
        .slice(0, 3),
    }));
    expect(
      listWidth.document <= listWidth.viewport,
      `List overflow at ${viewport.width}x${viewport.height}: ${listWidth.document}px document / ${listWidth.viewport}px viewport; ${JSON.stringify(listWidth.offenders)}`,
    ).toBe(true);
    await page.getByRole("button", { name: "Pipeline" }).click();
    const pipelineWidth = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(
      pipelineWidth.document <= pipelineWidth.viewport,
      `Pipeline overflow at ${viewport.width}x${viewport.height}: ${pipelineWidth.document}px document / ${pipelineWidth.viewport}px viewport`,
    ).toBe(true);
    await page.getByRole("button", { name: "Lista" }).click();
    await openSeedRequest(page);
    await expect(
      page.getByRole("dialog", { name: "Detalle de solicitud" }),
    ).toBeVisible();
    const detailWidth = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(
      detailWidth.document <= detailWidth.viewport,
      `Detail overflow at ${viewport.width}x${viewport.height}: ${detailWidth.document}px document / ${detailWidth.viewport}px viewport`,
    ).toBe(true);
    await page
      .getByRole("dialog", { name: "Detalle de solicitud" })
      .getByRole("button", { name: "Cerrar detalle" })
      .click();
  }
});

test("captures the advanced CRM deliverables", async ({ page }) => {
  await openCleanPanel(page);
  await enterBusiness(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({
    path: "artifacts/advanced-crm-audit/dashboard-1440.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Solicitudes" }).first().click();
  await page.screenshot({
    path: "artifacts/advanced-crm-audit/crm-list-1440.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Pipeline" }).click();
  await page.screenshot({
    path: "artifacts/advanced-crm-audit/crm-pipeline-1440.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Lista" }).click();
  await page.getByRole("button", { name: /Restaurante El Buen Sabor/ }).click();
  await page.screenshot({
    path: "artifacts/advanced-crm-audit/request-detail-1440.png",
  });
  await page
    .getByRole("dialog", { name: "Detalle de solicitud" })
    .getByRole("button", { name: "Cerrar detalle" })
    .click();
  await page.getByRole("button", { name: "Clientes" }).first().click();
  await page.screenshot({
    path: "artifacts/advanced-crm-audit/customers-1440.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /Restaurante El Buen Sabor/ }).click();
  await page.screenshot({
    path: "artifacts/advanced-crm-audit/customer-detail-1440.png",
  });
  await page
    .getByRole("dialog", { name: /Restaurante El Buen Sabor/ })
    .getByRole("button", { name: "Cerrar detalle del cliente" })
    .click();
  await page.getByRole("button", { name: "Nueva solicitud" }).click();
  await page.screenshot({
    path: "artifacts/advanced-crm-audit/manual-request-1440.png",
  });
  await page
    .getByRole("dialog", { name: "Nueva solicitud" })
    .getByRole("button", { name: "Cerrar nueva solicitud" })
    .click();

  await page.getByRole("button", { name: "Resumen" }).first().click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/advanced-crm-audit/dashboard-390.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Solicitudes" }).click();
  await page.screenshot({
    path: "artifacts/advanced-crm-audit/crm-390.png",
    fullPage: true,
  });
  await openSeedRequest(page);
  await page.screenshot({
    path: "artifacts/advanced-crm-audit/request-detail-390.png",
  });
});
