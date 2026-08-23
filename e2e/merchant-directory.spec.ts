import { expect, test, type Page } from "@playwright/test";

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

test("the merchant directory exposes demo profiles and active navigation", async ({
  page,
}) => {
  await page.goto("/comerciantes");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Encuentra comerciantes para cada necesidad",
    }),
  ).toBeVisible();
  await expect(page.getByTestId("merchant-card")).toHaveCount(6);
  await expect(
    page
      .getByRole("navigation", { name: "Navegación principal" })
      .getByRole("link", { name: "Comerciantes" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("6 comerciantes encontrados")).toBeVisible();
});

test("search and category filters update the merchant results", async ({
  page,
}) => {
  await page.goto("/comerciantes");

  await page
    .getByLabel("Categoría", { exact: true })
    .selectOption("category-grains");
  await expect(page.getByTestId("merchant-card")).toHaveCount(2);
  await expect(page.getByText("2 comerciantes encontrados")).toBeVisible();

  await page.getByLabel("Categoría", { exact: true }).selectOption("all");
  await page
    .getByRole("searchbox", { name: "Buscar comerciante o producto" })
    .fill("lacteos");
  await expect(page.getByTestId("merchant-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Lácteos La Esperanza" }),
  ).toBeVisible();

  await page
    .getByRole("searchbox", { name: "Buscar comerciante o producto" })
    .fill("producto inexistente");
  await expect(
    page.getByRole("heading", { name: "No encontramos coincidencias" }),
  ).toBeVisible();
});

test("a directory card navigates to its merchant profile", async ({ page }) => {
  await page.goto("/comerciantes");

  const card = page
    .getByTestId("merchant-card")
    .filter({ hasText: "Comercial Frutas del Valle" });
  await card.getByRole("link", { name: "Ver perfil" }).click();

  await expect(page).toHaveURL(/\/comerciantes\/comercial-frutas-del-valle$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Comercial Frutas del Valle",
    }),
  ).toBeVisible();
  await expect(page.getByText("Productos destacados")).toBeVisible();
});

const directoryViewports = [
  { name: "375x812", width: 375, height: 812 },
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

for (const viewport of directoryViewports) {
  test(`merchant directory has no overflow at ${viewport.name}`, async ({
    page,
  }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto("/comerciantes");
    await expect(page.getByTestId("merchant-card").first()).toBeVisible();

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasOverflow).toBe(false);
    expect(runtimeErrors).toEqual([]);

    await page.screenshot({
      path: `artifacts/merchant-directory/directory-${viewport.name}.png`,
      fullPage: true,
    });
  });
}
