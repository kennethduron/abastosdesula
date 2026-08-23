import { expect, test, type Page } from "@playwright/test";

const firebaseE2E = process.env.PLAYWRIGHT_FIREBASE_E2E === "true";
const merchantA = {
  email: process.env.DEMO_MERCHANT_EMAIL ?? "",
  password: process.env.DEMO_MERCHANT_PASSWORD ?? "",
};
const merchantB = {
  email: process.env.DEMO_MERCHANT_B_EMAIL ?? "",
  password: process.env.DEMO_MERCHANT_B_PASSWORD ?? "",
};
const admin = {
  email: process.env.DEMO_ADMIN_EMAIL ?? "",
  password: process.env.DEMO_ADMIN_PASSWORD ?? "",
};

test.skip(!firebaseE2E, "Requires isolated Firebase Auth/Firestore emulators.");

async function login(page: Page, credentials: typeof merchantA) {
  await page.goto("/acceso");
  await page.getByLabel("Correo electrónico").fill(credentials.email);
  await page.getByLabel("Contraseña").fill(credentials.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

test("Firebase persists a quote workflow and isolates another merchant", async ({
  page,
  request,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await request.delete("/api/auth/session");

  const customerName = `Cliente Firebase ${Date.now()}`;
  await page.goto("/comerciantes/comercial-frutas-del-valle");
  await page
    .getByTestId("catalog-product")
    .first()
    .getByRole("button", { name: "Agregar" })
    .click();
  const cart = page.getByRole("dialog", { name: "Tu solicitud" });
  await cart.getByLabel("Nombre completo").fill(customerName);
  await cart.getByLabel("Tipo de cliente").selectOption("business");
  await cart.getByLabel("Teléfono").fill("99990000");
  await cart.getByRole("button", { name: "Enviar solicitud demo" }).click();
  await expect(page.getByTestId("quote-confirmation")).toBeVisible();

  await login(page, merchantA);
  await expect(page).toHaveURL(/\/panel$/);
  await expect(page.getByText(customerName).first()).toBeVisible();
  await page
    .getByRole("button")
    .filter({ hasText: customerName })
    .first()
    .click();
  const status = page.getByLabel("Estado de la solicitud");
  await status.selectOption("in_review");
  await expect(status).toHaveValue("in_review");
  await page.reload();
  await expect(page.getByText(customerName).first()).toBeVisible();
  await page
    .getByRole("button")
    .filter({ hasText: customerName })
    .first()
    .click();
  await expect(page.getByLabel("Estado de la solicitud")).toHaveValue(
    "in_review",
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({
    path: "artifacts/firebase/merchant-a-persisted-quote-1440x900.png",
    fullPage: true,
  });

  await request.delete("/api/auth/session");
  await login(page, merchantB);
  await expect(page).toHaveURL(/\/panel$/);
  await expect(page.getByText(customerName)).toHaveCount(0);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/panel$/);

  await request.delete("/api/auth/session");
  await login(page, admin);
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: "Resumen de la plataforma" }),
  ).toBeVisible();
  await expect(page.getByText(customerName)).toHaveCount(0);
  await page.goto("/panel");
  await expect(page).toHaveURL(/\/admin$/);
  await page.screenshot({
    path: "artifacts/firebase/admin-aggregate-only-1440x900.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Cerrar sesión demo" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/acceso$/);
  expect(consoleErrors).toEqual([]);
});
