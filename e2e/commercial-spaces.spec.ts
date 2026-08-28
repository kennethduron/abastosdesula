import { expect, test, type Page } from "@playwright/test";

async function expectNoPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
}

test("public commercial-space inquiry journey is clear and responsive", async ({
  page,
}) => {
  await page.route("**/api/leasing-inquiries", async (route) => {
    expect(route.request().method()).toBe("POST");
    const body = route.request().postDataJSON();
    expect(body.commercialSpaceId).toBe("space-wide-retail");
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "controlled-inquiry",
        reference: "LAS-20260828-AUD001",
      }),
    });
  });
  await page.goto("/");
  await expect(page.getByTestId("spaces-section")).toBeVisible();
  await page
    .getByTestId("spaces-section")
    .getByRole("link", { name: "Ver locales" })
    .click();
  await expect(page).toHaveURL(/\/locales$/);
  await page
    .getByTestId("commercial-space-card")
    .first()
    .getByRole("link", { name: "Ver espacio" })
    .click();
  await expect(page.getByTestId("space-gallery")).toBeVisible();
  await page.getByTestId("open-leasing-inquiry").first().click();
  await page.getByLabel(/Nombre completo/).fill("María Hernández");
  await page.getByLabel(/^Teléfono/).fill("99990000");
  await page.getByLabel(/Tipo de negocio/).fill("Distribución de alimentos");
  await page
    .getByLabel(/Uso que desea darle/)
    .fill("Distribución y almacenamiento de alimentos empacados.");
  await page.getByRole("button", { name: /Enviar solicitud/ }).click();
  await expect(page.getByTestId("leasing-inquiry-success")).toContainText(
    "Solicitud recibida",
  );
  await expect(page.getByTestId("leasing-inquiry-success")).toContainText(
    "LAS-20260828-AUD001",
  );
});

test("commercial spaces and leasing admin have no page-level horizontal overflow", async ({
  page,
}) => {
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/locales");
    await expectNoPageOverflow(page);
    await page.goto("/locales/local-comercial-amplio");
    await expectNoPageOverflow(page);
    await page.goto("/admin/locales");
    await expectNoPageOverflow(page);
  }
});

test("institutional leasing follow-up persists through refresh", async ({
  page,
}) => {
  await page.goto("/admin/locales");
  await page.evaluate(() =>
    window.localStorage.removeItem("abastos-leasing-audit"),
  );
  await page.reload();
  await expect(page.getByText("LAS-20260828-AUD001").first()).toBeVisible();

  await page.getByLabel("Estado").selectOption("contacted");
  await page.getByLabel("Nota interna").fill("Contacto inicial realizado.");
  await page.getByLabel("Próxima acción").fill("Coordinar visita al espacio");
  await page.getByLabel("Programar seguimiento").fill("2026-09-03T09:30");
  await page.getByRole("button", { name: "Guardar seguimiento" }).click();
  await expect(page.getByText("Seguimiento guardado.")).toBeVisible();

  await page.getByLabel("Estado").selectOption("visit_scheduled");
  await page.getByRole("button", { name: "Guardar seguimiento" }).click();
  await page.reload();
  await expect(page.getByLabel("Estado")).toHaveValue("visit_scheduled");
  await expect(page.getByText("Contacto inicial realizado.")).toBeVisible();
  await expect(page.getByLabel("Próxima acción")).toHaveValue(
    "Coordinar visita al espacio",
  );
});

test("captures commercial-space audit screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByTestId("spaces-section").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "artifacts/commercial-spaces-audit/home-spaces-1440.png",
    fullPage: true,
  });
  await page.goto("/locales");
  await page.screenshot({
    path: "artifacts/commercial-spaces-audit/spaces-list-1440.png",
    fullPage: true,
  });
  await page.goto("/locales/local-comercial-amplio");
  await page.screenshot({
    path: "artifacts/commercial-spaces-audit/space-detail-1440.png",
    fullPage: true,
  });
  await page.getByTestId("space-gallery").screenshot({
    path: "artifacts/commercial-spaces-audit/space-gallery-1440.png",
  });
  await page.getByTestId("open-leasing-inquiry").first().click();
  await page.getByRole("dialog").screenshot({
    path: "artifacts/commercial-spaces-audit/space-inquiry-1440.png",
  });
  await page.keyboard.press("Escape");
  await page.goto("/admin/locales");
  await page.screenshot({
    path: "artifacts/commercial-spaces-audit/admin-leasing-1440.png",
    fullPage: true,
  });
  await page.screenshot({
    path: "artifacts/commercial-spaces-audit/admin-leasing-detail-1440.png",
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/locales");
  await page.screenshot({
    path: "artifacts/commercial-spaces-audit/spaces-list-390.png",
    fullPage: true,
  });
  await page.goto("/locales/local-comercial-amplio");
  await page.screenshot({
    path: "artifacts/commercial-spaces-audit/space-detail-390.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 1600 });
  await page.getByTestId("open-leasing-inquiry").first().click();
  await page.getByRole("dialog").screenshot({
    path: "artifacts/commercial-spaces-audit/space-inquiry-390.png",
  });
  await page.keyboard.press("Escape");
  await page.goto("/admin/locales");
  await page.screenshot({
    path: "artifacts/commercial-spaces-audit/admin-leasing-390.png",
    fullPage: true,
  });
});
