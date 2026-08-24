import { expect, test } from "@playwright/test";

const artifactDir = "artifacts/tenant-self-service-audit";

test("merchant account presents isolated billing details responsively", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/panel");
  await page.getByLabel("Comerciante").selectOption("business-frutas-valle");
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await page
    .getByRole("button", { name: "Estado de cuenta", exact: true })
    .click();

  await expect(page.getByTestId("tenant-account")).toBeVisible();
  await expect(
    page.getByText("Comercial Frutas del Valle").first(),
  ).toBeVisible();
  await expect(page.getByText("Verduras La Huerta")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Pago en línea" }),
  ).toBeDisabled();
  await page.screenshot({
    path: `${artifactDir}/tenant-account-1440.png`,
    fullPage: true,
  });

  await page.getByRole("button", { name: "Historial" }).click();
  await expect(page.getByTestId("tenant-payments")).toBeVisible();
  await page.screenshot({
    path: `${artifactDir}/tenant-payments-1440.png`,
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("tenant-payments")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page
    .getByTestId("tenant-account")
    .getByRole("button", { name: "Resumen" })
    .click();
  await page.screenshot({
    path: `${artifactDir}/tenant-account-390.png`,
    fullPage: true,
  });
});

test("institutional administration shows real tenant aggregates", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Entrar a administración" }).click();

  await expect(page.getByTestId("admin-tenants")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Inquilinos y estados de cuenta" }),
  ).toBeVisible();
  await expect(page.getByText("Inquilinos activos")).toBeVisible();
  await expect(page.getByTestId("admin-payment-status")).toBeVisible();
  await page.getByRole("link", { name: "Inquilinos" }).click();
  await page.screenshot({
    path: `${artifactDir}/admin-tenants-1440.png`,
    fullPage: true,
  });
  await page.getByTestId("admin-payment-status").screenshot({
    path: `${artifactDir}/admin-payment-status-1440.png`,
  });
});
