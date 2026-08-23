import { expect, test, type Page } from "@playwright/test";

const firstProfile = "/comerciantes/comercial-frutas-del-valle";

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

async function openCleanProfile(page: Page) {
  await page.goto(firstProfile);
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
}

test("merchant profile exposes a searchable demo catalog", async ({ page }) => {
  await openCleanProfile(page);

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Comercial Frutas del Valle",
    }),
  ).toBeVisible();
  await expect(page.getByTestId("catalog-product")).toHaveCount(2);

  await page
    .getByRole("searchbox", { name: "Buscar en este catálogo" })
    .fill("sandia");
  await expect(page.getByTestId("catalog-product")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Sandía" })).toBeVisible();
});

test("cart updates quantities and persists after refresh", async ({ page }) => {
  await openCleanProfile(page);

  const tomato = page
    .getByTestId("catalog-product")
    .filter({ hasText: "Tomate Saladette" });
  await tomato.getByRole("button", { name: "Agregar" }).click();

  const cart = page.getByRole("dialog", { name: "Tu solicitud" });
  await expect(cart).toBeVisible();
  await expect(cart.getByText("Comercial Frutas del Valle")).toBeVisible();
  await cart
    .getByRole("button", { name: "Aumentar cantidad de Tomate Saladette" })
    .click();
  await expect(cart.getByText("2", { exact: true })).toBeVisible();
  await cart.getByRole("button", { name: "Cerrar carrito" }).click();
  await expect(page.getByTestId("cart-dock")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("cart-dock")).toBeVisible();
});

test("cart prevents products from different merchants", async ({ page }) => {
  await openCleanProfile(page);
  await page
    .getByTestId("catalog-product")
    .first()
    .getByRole("button", { name: "Agregar" })
    .click();
  await page
    .getByRole("dialog", { name: "Tu solicitud" })
    .getByRole("button", { name: "Cerrar carrito" })
    .click();

  await page.goto("/comerciantes/verduras-la-huerta");
  await page
    .getByTestId("catalog-product")
    .first()
    .getByRole("button", { name: "Agregar" })
    .click();

  const conflict = page.getByRole("dialog", {
    name: "Tu carrito pertenece a otro comerciante",
  });
  await expect(conflict).toBeVisible();
  await conflict.getByRole("button", { name: "Conservar carrito" }).click();
  await page.getByTestId("cart-dock").click();
  await expect(
    page
      .getByRole("dialog", { name: "Tu solicitud" })
      .getByText("Comercial Frutas del Valle"),
  ).toBeVisible();
});

const profileViewports = [
  { name: "375x812", width: 375, height: 812 },
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

for (const viewport of profileViewports) {
  test(`merchant profile and cart have no overflow at ${viewport.name}`, async ({
    page,
  }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await openCleanProfile(page);
    await expect(page.getByTestId("catalog-product").first()).toBeVisible();

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(runtimeErrors).toEqual([]);

    await page.screenshot({
      path: `artifacts/merchant-profile/profile-${viewport.name}.png`,
      fullPage: true,
    });
  });
}

for (const viewport of [
  { name: "390x844", width: 390, height: 844 },
  { name: "1440x900", width: 1440, height: 900 },
]) {
  test(`captures the cart at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await openCleanProfile(page);
    await page
      .getByTestId("catalog-product")
      .first()
      .getByRole("button", { name: "Agregar" })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Tu solicitud" }),
    ).toBeVisible();
    await page.screenshot({
      path: `artifacts/cart/cart-${viewport.name}.png`,
      fullPage: false,
    });
  });
}
