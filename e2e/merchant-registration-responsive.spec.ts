import { expect, test, type Page } from "@playwright/test";

const artifactDir = "artifacts/merchant-registration-responsive";
const route = "/registro-comerciante";

const viewports = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 820, height: 1180 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

const screenshotNames = new Map([
  ["375x812-top", "registration-375-top.png"],
  ["375x812-bottom", "registration-375-bottom.png"],
  ["390x844-top", "registration-390-top.png"],
  ["390x844-bottom", "registration-390-bottom.png"],
  ["768x1024-top", "registration-768-top.png"],
  ["768x1024-bottom", "registration-768-bottom.png"],
  ["1440x900-top", "registration-1440-top.png"],
  ["1440x900-bottom", "registration-1440-bottom.png"],
]);

function screenshotPath(name: string) {
  return `${artifactDir}/${name}`;
}

async function expectNativeDocumentScroll(page: Page) {
  const initial = await page.evaluate(() => ({
    scrollingElementIsRoot:
      document.scrollingElement === document.documentElement,
    scrollHeight: document.documentElement.scrollHeight,
    scrollWidth: document.documentElement.scrollWidth,
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth,
    htmlOverflowY: getComputedStyle(document.documentElement).overflowY,
    bodyOverflowY: getComputedStyle(document.body).overflowY,
  }));

  expect(initial.scrollingElementIsRoot).toBe(true);
  expect(initial.scrollHeight).toBeGreaterThan(initial.innerHeight);
  expect(initial.scrollWidth).toBeLessThanOrEqual(initial.innerWidth);
  expect(initial.htmlOverflowY).not.toBe("hidden");
  expect(initial.bodyOverflowY).not.toBe("hidden");

  await page.evaluate(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    });
  });
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);

  await expect(page.getByRole("contentinfo")).toBeInViewport();

  const submitButton = page.getByRole("button", { name: "Solicitar acceso" });
  await submitButton.evaluate((element) =>
    element.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await expect(submitButton).toBeInViewport();

  const final = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(final.scrollWidth).toBeLessThanOrEqual(final.innerWidth);
}

test.describe("merchant registration native document scrolling", () => {
  for (const viewport of viewports) {
    test(`${viewport.width}x${viewport.height} reaches the complete form without horizontal overflow`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });

      await page.setViewportSize(viewport);
      await page.goto(route);
      await expect(
        page.getByRole("heading", { name: "Solicita acceso para tu negocio" }),
      ).toBeVisible();

      const key = `${viewport.width}x${viewport.height}`;
      const topScreenshot = screenshotNames.get(`${key}-top`);
      if (topScreenshot) {
        await page.screenshot({ path: screenshotPath(topScreenshot) });
      }

      if (key === "430x932") {
        await page.screenshot({
          path: screenshotPath("registration-430.png"),
          fullPage: true,
        });
      }
      if (key === "1024x768") {
        await page.screenshot({
          path: screenshotPath("registration-1024.png"),
          fullPage: true,
        });
      }

      await expectNativeDocumentScroll(page);

      const bottomScreenshot = screenshotNames.get(`${key}-bottom`);
      if (bottomScreenshot) {
        await page.screenshot({ path: screenshotPath(bottomScreenshot) });
      }

      expect(consoleErrors).toEqual([]);
    });
  }
});

test("wheel scrolling and the mobile menu restore native body scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);

  await page.mouse.wheel(0, 700);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.getByRole("button", { name: "Abrir menú principal" }).click();
  await expect(
    page.getByRole("navigation", { name: "Navegación móvil" }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("hidden");
  await page.keyboard.press("Escape");
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("");

  await page.mouse.wheel(0, 700);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
});

test("mobile focus remains visible with a reduced visual viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 520 });
  await page.goto(route);

  const fields = [
    "Nombre del responsable",
    "Correo electrónico",
    "Teléfono",
    "WhatsApp",
    "Nombre comercial",
    "Local o puesto (opcional)",
    "Contraseña",
    "Confirmar contraseña",
  ];

  for (const label of fields) {
    const input = page.getByLabel(label, { exact: true });
    await input.evaluate((element: HTMLElement) => element.focus());
    await expect(input).toBeFocused();
    await expect(input).toBeInViewport();
  }

  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test("fields have an accessible order, validation linkage and native category select", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);

  const responsibleName = page.getByLabel("Nombre del responsable");
  await responsibleName.focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Correo electrónico")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Teléfono")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("WhatsApp", { exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Nombre comercial")).toBeFocused();
  await page.keyboard.press("Tab");
  const category = page.getByLabel("Categoría");
  await expect(category).toBeFocused();
  await category.selectOption("category-groceries");
  await expect(category).toHaveValue("category-groceries");

  await page.getByRole("button", { name: "Solicitar acceso" }).click();
  await expect(responsibleName).toHaveAttribute("aria-invalid", "true");
  const errorId = await responsibleName.getAttribute("aria-describedby");
  expect(errorId).toBeTruthy();
  await expect(page.locator(`#${errorId}`)).toBeVisible();
});
