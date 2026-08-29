import { expect, test, type Locator, type Page } from "@playwright/test";

const auditDir = "artifacts/responsive-interaction-audit";
const spaceDetail = "/locales/local-comercial-amplio";

const completeViewportMatrix = [
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 375, height: 667 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 430, height: 932 },
  { width: 600, height: 960 },
  { width: 768, height: 1024 },
  { width: 810, height: 1080 },
  { width: 820, height: 1180 },
  { width: 1024, height: 768 },
  { width: 1024, height: 1366 },
  { width: 1280, height: 720 },
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
  { width: 1600, height: 900 },
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
  { width: 932, height: 430 },
] as const;

const screenshotViewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

async function expectNoGlobalOverflow(page: Page) {
  const result = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    offenders: [...document.querySelectorAll<HTMLElement>("body *")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          className: element.className,
          left: rect.left,
          right: rect.right,
          width: rect.width,
        };
      })
      .filter(
        (item) =>
          item.width > 1 &&
          (item.left < -1 || item.right > window.innerWidth + 1),
      )
      .slice(0, 8),
  }));
  expect(
    result.documentWidth,
    JSON.stringify(result.offenders),
  ).toBeLessThanOrEqual(result.viewportWidth);
}

async function visibleLeasingTrigger(page: Page, width: number) {
  const trigger =
    width < 768
      ? page
          .getByTestId("mobile-leasing-cta")
          .getByTestId("open-leasing-inquiry")
      : page.locator("aside").getByTestId("open-leasing-inquiry");
  await expect(trigger).toHaveCount(1);
  await trigger.scrollIntoViewIfNeeded();
  await expect(trigger).toBeInViewport();
  return trigger;
}

async function expectDialogInsideViewport(page: Page, dialog: Locator) {
  const geometry = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  });
  expect(geometry.top).toBeGreaterThanOrEqual(-1);
  expect(geometry.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
  expect(geometry.height).toBeGreaterThan(100);
}

async function openCleanPanel(page: Page) {
  await page.goto("/panel");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByLabel("Comerciante").selectOption("business-frutas-valle");
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await expect(
    page.getByRole("heading", { name: "Resumen general" }),
  ).toBeVisible();
}

async function openCleanAdmin(page: Page) {
  await page.goto("/admin");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Entrar a administración" }).click();
  await expect(
    page.getByRole("heading", { name: "Resumen de la plataforma" }),
  ).toBeVisible();
}

test("leasing dialog remains inside every requested viewport and restores scroll and focus", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const runtimeErrors = collectRuntimeErrors(page);

  for (const viewport of completeViewportMatrix) {
    await page.setViewportSize(viewport);
    await page.goto(spaceDetail);
    const trigger = await visibleLeasingTrigger(page, viewport.width);
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await trigger.click();

    const dialog = page.getByTestId("leasing-inquiry-dialog");
    await expect(dialog).toBeVisible();
    await expectDialogInsideViewport(page, dialog);
    await expect(page.getByTestId("leasing-inquiry-actions")).toBeInViewport();
    await expect(
      dialog.getByRole("button", { name: "Cerrar formulario" }),
    ).toBeInViewport();
    await expect(
      dialog.getByRole("button", { name: "Enviar solicitud" }),
    ).toBeInViewport();
    await expectNoGlobalOverflow(page);

    const scrollArea = page.getByTestId("leasing-inquiry-scroll");
    const scrollMetrics = await scrollArea.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        overflowY: style.overflowY,
      };
    });
    expect(["auto", "scroll"]).toContain(scrollMetrics.overflowY);
    expect(scrollMetrics.clientHeight).toBeGreaterThan(0);

    await scrollArea.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(
      dialog.getByRole("button", { name: "Enviar solicitud" }),
    ).toBeInViewport();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  }
  expect(runtimeErrors).toEqual([]);
});

test("leasing form remains usable with reduced visual height, validation and one submit", async ({
  page,
}) => {
  await page.route("**/api/leasing-inquiries", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 120));
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "responsive-controlled",
        reference: "LAS-RESPONSIVE-AUDIT",
      }),
    });
  });
  let requests = 0;
  page.on("request", (request) => {
    if (
      request.url().includes("/api/leasing-inquiries") &&
      request.method() === "POST"
    )
      requests += 1;
  });

  await page.setViewportSize({ width: 390, height: 520 });
  await page.goto(spaceDetail);
  await (await visibleLeasingTrigger(page, 390)).click();
  const dialog = page.getByTestId("leasing-inquiry-dialog");
  await expectDialogInsideViewport(page, dialog);

  await dialog.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(dialog.getByText("Revisa este campo.").first()).toBeVisible();
  await dialog.getByLabel("Nombre completo *").fill("Auditoría Responsive");
  await dialog.getByLabel("Teléfono *").fill("99990000");
  await dialog
    .getByLabel("Tipo de negocio *")
    .fill("Distribución de alimentos");
  await dialog
    .getByLabel("Uso que desea darle al espacio *")
    .fill("Validación controlada de accesibilidad y scroll interno.");
  await dialog
    .getByLabel("Comentarios / necesidades")
    .fill("Contenido controlado sin información personal real.");
  await expect(
    dialog.getByRole("button", { name: "Enviar solicitud" }),
  ).toBeInViewport();
  await dialog.getByRole("button", { name: "Enviar solicitud" }).dblclick();
  await expect(page.getByTestId("leasing-inquiry-success")).toBeVisible();
  expect(requests).toBe(1);
});

test("captures the corrected open leasing form matrix", async ({ page }) => {
  test.setTimeout(90_000);
  for (const viewport of screenshotViewports) {
    await page.setViewportSize(viewport);
    await page.goto(spaceDetail);
    await (await visibleLeasingTrigger(page, viewport.width)).click();
    await expectDialogInsideViewport(
      page,
      page.getByTestId("leasing-inquiry-dialog"),
    );
    await page.screenshot({
      path: `${auditDir}/leasing-form-${viewport.width}x${viewport.height}.png`,
    });
    await page.keyboard.press("Escape");
  }
});

test("cart, CRM and admin overlays remain usable and keyboard accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/comerciantes/comercial-frutas-del-valle");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  const addButton = page
    .getByTestId("catalog-product")
    .filter({ hasText: "Tomate Saladette" })
    .getByRole("button", { name: "Agregar" });
  await addButton.click();
  const cart = page.getByRole("dialog", { name: "Tu solicitud" });
  await expectDialogInsideViewport(page, cart);
  await expect(
    cart.getByRole("button", { name: "Cerrar carrito" }),
  ).toBeFocused();
  await page.screenshot({ path: `${auditDir}/cart-drawer-320x568.png` });
  await page.keyboard.press("Escape");
  await expect(cart).toBeHidden();
  await expect(addButton).toBeFocused();

  await page.getByTestId("cart-dock").click();
  await cart.getByLabel("Observaciones (opcional)").scrollIntoViewIfNeeded();
  await expect(
    cart.getByRole("button", { name: "Enviar solicitud" }),
  ).toBeInViewport();
  await cart.getByRole("button", { name: "Cerrar carrito" }).click();

  await openCleanPanel(page);
  const newRequest = page.getByRole("button", { name: "Nueva solicitud" });
  await newRequest.click();
  const manualRequest = page.getByRole("dialog", {
    name: "Nueva solicitud",
  });
  await expectDialogInsideViewport(page, manualRequest);
  await expect(
    manualRequest.getByRole("button", { name: "Cerrar nueva solicitud" }),
  ).toBeInViewport();
  await page.screenshot({
    path: `${auditDir}/merchant-manual-request-320x568.png`,
  });
  await page.keyboard.press("Escape");
  await expect(manualRequest).toBeHidden();
  await expect(newRequest).toBeFocused();

  await page.getByRole("button", { name: /Restaurante El Buen Sabor/ }).click();
  const requestDetail = page.getByRole("dialog", {
    name: "Detalle de solicitud",
  });
  await expectDialogInsideViewport(page, requestDetail);
  await expect(
    requestDetail.getByRole("button", { name: "Cerrar detalle" }),
  ).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(requestDetail).toBeHidden();

  await openCleanAdmin(page);
  await page.goto("/admin/locales");
  await page.getByRole("button", { name: "Locales" }).click();
  const createSpace = page.getByRole("button", { name: "Crear espacio" });
  await createSpace.click();
  const createDialog = page.getByRole("dialog", { name: "Crear espacio" });
  await expectDialogInsideViewport(page, createDialog);
  await expect(
    createDialog.getByRole("button", {
      name: "Cerrar creación de espacio",
    }),
  ).toBeInViewport();
  await page.screenshot({
    path: `${auditDir}/admin-create-space-320x568.png`,
  });
  await page.keyboard.press("Escape");
  await expect(createDialog).toBeHidden();
  await expect(createSpace).toBeFocused();
});

test("public navigation, forms and key routes remain interactive without global overflow", async ({
  page,
}) => {
  test.setTimeout(150_000);
  const runtimeErrors = collectRuntimeErrors(page);
  const routes = [
    "/",
    "/comerciantes",
    "/comerciantes/comercial-frutas-del-valle",
    "/productos",
    "/productos/tomate-saladette",
    "/locales",
    spaceDetail,
    "/promociones",
    "/noticias",
    "/noticias/guia-para-cotizar",
    "/contacto",
    "/acceso",
    "/registro-comerciante",
  ];
  const viewports = [
    { width: 320, height: 568 },
    { width: 768, height: 1024 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
    { width: 844, height: 390 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBeLessThan(400);
      await expectNoGlobalOverflow(page);
    }
  }

  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  const menuButton = page.getByRole("button", {
    name: "Abrir menú principal",
  });
  await menuButton.click();
  await expect(
    page.getByRole("navigation", { name: "Navegación móvil" }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(menuButton).toBeFocused();

  await page.goto("/contacto");
  const contactAction = page
    .getByRole("main")
    .getByRole("link", { name: "Contactar por WhatsApp" });
  await contactAction.scrollIntoViewIfNeeded();
  await expect(contactAction).toBeInViewport();

  await page.goto("/acceso");
  const loginSubmit = page.getByRole("button", { name: "Iniciar sesión" });
  if ((await loginSubmit.count()) > 0) {
    await loginSubmit.scrollIntoViewIfNeeded();
    await expect(loginSubmit).toBeInViewport();
  } else {
    await expect(
      page.getByRole("link", { name: "Panel del comerciante" }),
    ).toBeInViewport();
  }

  await page.goto("/registro-comerciante");
  const registrationSubmit = page.locator('button[type="submit"]');
  await expect(registrationSubmit).toHaveCount(1);
  await registrationSubmit.scrollIntoViewIfNeeded();
  await expect(registrationSubmit).toBeInViewport();
  expect(runtimeErrors).toEqual([]);
});

test("effective 100, 125 and 150 percent scaling keeps controls reachable", async ({
  page,
}) => {
  for (const scale of [1, 1.25, 1.5]) {
    await page.setViewportSize({
      width: Math.round(1280 / scale),
      height: Math.round(720 / scale),
    });
    await page.goto(spaceDetail);
    await expectNoGlobalOverflow(page);
    const trigger = page.locator("aside").getByTestId("open-leasing-inquiry");
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await expectDialogInsideViewport(
      page,
      page.getByTestId("leasing-inquiry-dialog"),
    );
    await page.keyboard.press("Escape");
  }
});
