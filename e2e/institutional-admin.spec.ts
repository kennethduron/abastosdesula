import { expect, test, type Page } from "@playwright/test";

async function openCleanAdmin(page: Page) {
  await page.goto("/admin");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
}

async function enterAdmin(page: Page) {
  await page
    .getByRole("button", { name: "Entrar como administrador demo" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resumen de la plataforma" }),
  ).toBeVisible();
}

test("institutional demo gate exposes aggregate-only administration", async ({
  page,
}) => {
  await openCleanAdmin(page);
  await expect(
    page.getByText("Acceso institucional de demostración"),
  ).toBeVisible();
  await enterAdmin(page);
  await expect(page.getByText("Comerciantes activos")).toBeVisible();
  await expect(page.getByText("Solicitudes demo")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Contenido demo" }),
  ).toBeVisible();
  await expect(page.getByText("Restaurante El Buen Sabor")).toHaveCount(0);
});

test("merchant role cannot open institutional administration", async ({
  page,
}) => {
  await page.goto("/panel");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Entrar al panel demo" }).click();
  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "Acceso institucional restringido" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Resumen de la plataforma" }),
  ).toHaveCount(0);
});

test("admin changes merchant status and category visibility persistently", async ({
  page,
}) => {
  await openCleanAdmin(page);
  await enterAdmin(page);

  const merchantStatus = page
    .getByLabel("Estado de Comercial Frutas del Valle")
    .first();
  await merchantStatus.selectOption("pending");
  await page.getByRole("button", { name: "Ocultar en demo" }).first().click();
  await expect(
    page.getByRole("button", { name: "Mostrar en demo" }).first(),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByLabel("Estado de Comercial Frutas del Valle").first(),
  ).toHaveValue("pending");
  await expect(
    page.getByRole("button", { name: "Mostrar en demo" }).first(),
  ).toBeVisible();
  await expect(page.getByText(/cambió a estado pending/)).toBeVisible();
});

test("institutional admin stays console-clean and without page overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await openCleanAdmin(page);
  await enterAdmin(page);

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    const { scrollWidth, offenders } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll("*")]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName,
            className: element.getAttribute("class"),
            left: rect.left,
            right: rect.right,
            width: rect.width,
          };
        })
        .filter((item) => item.right > window.innerWidth + 1)
        .slice(0, 8),
    }));
    expect(
      scrollWidth,
      `document width at ${viewport.width}x${viewport.height}: ${JSON.stringify(offenders)}`,
    ).toBeLessThanOrEqual(viewport.width);
  }
  expect(errors).toEqual([]);
});

test("captures the responsive institutional admin matrix", async ({ page }) => {
  await openCleanAdmin(page);
  await enterAdmin(page);
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
      path: `artifacts/institutional-admin/admin-${width}x${height}.png`,
      fullPage: true,
    });
  }
});
