import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

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
const firestoreBase =
  "https://firestore.googleapis.com/v1/projects/abastosdesula-demo/databases/(default)/documents";

test.skip(!firebaseE2E, "Requires explicit Firebase E2E authorization.");

async function login(page: Page, credentials: typeof merchantA) {
  await page.goto("/acceso");
  await page.getByLabel("Correo electrónico").fill(credentials.email);
  await page.getByLabel("Contraseña").fill(credentials.password);
  const tokenResponse = page.waitForResponse(
    (response) =>
      response.url().includes("identitytoolkit.googleapis.com") &&
      response.url().includes("accounts:signInWithPassword") &&
      response.request().method() === "POST",
  );
  const sessionResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/session") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  const response = await tokenResponse;
  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as { idToken?: string };
  expect(payload.idToken).toBeTruthy();
  expect((await sessionResponse).ok()).toBeTruthy();
  return payload.idToken as string;
}

async function submitQuote(
  page: Page,
  merchantSlug: string,
  customerName: string,
) {
  await page.goto(`/comerciantes/${merchantSlug}`);
  await page
    .getByTestId("catalog-product")
    .first()
    .getByRole("button", { name: "Agregar" })
    .click();
  const cart = page.getByRole("dialog", { name: "Tu solicitud" });
  await cart.getByLabel("Nombre completo").fill(customerName);
  await cart.getByLabel("Tipo de cliente").selectOption("business");
  await cart.getByLabel("Teléfono").fill("99990000");
  await cart.getByRole("button", { name: "Enviar solicitud" }).click();
  await expect(page.getByTestId("quote-confirmation")).toBeVisible();
}

async function findQuote(
  request: APIRequestContext,
  idToken: string,
  businessId: string,
  customerName: string,
) {
  const response = await request.post(`${firestoreBase}:runQuery`, {
    headers: { Authorization: `Bearer ${idToken}` },
    data: {
      structuredQuery: {
        from: [{ collectionId: "quoteRequests" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "businessId" },
            op: "EQUAL",
            value: { stringValue: businessId },
          },
        },
      },
    },
  });
  expect(response.status()).toBe(200);
  const rows = (await response.json()) as Array<{
    document?: {
      name: string;
      fields: Record<string, { stringValue?: string }>;
    };
  }>;
  const document = rows
    .map((row) => row.document)
    .find((item) => item?.fields.customerName?.stringValue === customerName);
  expect(document).toBeTruthy();
  return {
    id: document?.name.split("/").at(-1) as string,
    customerId: document?.fields.customerId.stringValue as string,
  };
}

async function expectQuoteStatus(
  request: APIRequestContext,
  idToken: string,
  quoteId: string,
  expectedStatus: string,
) {
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `${firestoreBase}/quoteRequests/${quoteId}`,
          { headers: { Authorization: `Bearer ${idToken}` } },
        );
        if (response.status() !== 200) return `HTTP_${response.status()}`;
        const document = (await response.json()) as {
          fields?: { status?: { stringValue?: string } };
        };
        return document.fields?.status?.stringValue ?? "MISSING";
      },
      { timeout: 15_000 },
    )
    .toBe(expectedStatus);
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

  const auditSuffix = Date.now();
  const customerNameA = `Cliente Auditoría A ${auditSuffix}`;
  const customerNameB = `Cliente Auditoría B ${auditSuffix}`;
  const internalNote = `Nota privada de auditoría ${auditSuffix}`;
  const followUpTitle = `Confirmar solicitud ${auditSuffix}`;
  const followUpDate = new Date(Date.now() + 86_400_000)
    .toISOString()
    .slice(0, 10);
  await submitQuote(page, "comercial-frutas-del-valle", customerNameA);
  await submitQuote(page, "verduras-la-huerta", customerNameB);

  const merchantAToken = await login(page, merchantA);
  await expect(page).toHaveURL(/\/panel$/);
  await expect(page.getByText(customerNameA).first()).toBeVisible();
  await expect(page.getByText(customerNameB)).toHaveCount(0);
  const quoteA = await findQuote(
    request,
    merchantAToken,
    "business-frutas-valle",
    customerNameA,
  );

  await page
    .getByRole("button")
    .filter({ hasText: customerNameA })
    .first()
    .click();
  const detail = page.getByRole("dialog", { name: "Detalle de solicitud" });
  await detail.getByLabel("Nueva nota interna").fill(internalNote);
  await detail.getByRole("button", { name: "Agregar nota" }).click();
  await expect(detail.getByText(internalNote)).toBeVisible();
  await detail.getByLabel("Título").fill(followUpTitle);
  await detail.getByLabel("Fecha").fill(followUpDate);
  await detail.getByLabel("Hora (opcional)").fill("10:30");
  await detail.getByRole("button", { name: "Programar seguimiento" }).click();
  await expect(detail.getByText(followUpTitle)).toBeVisible();
  const status = page.getByLabel("Estado de la solicitud");
  await status.selectOption("in_review");
  await expectQuoteStatus(request, merchantAToken, quoteA.id, "in_review");
  await detail.getByRole("tab", { name: "Cotización" }).click();
  await detail
    .getByLabel(/^Precio de /)
    .first()
    .fill("12.50");
  await detail.getByLabel("Descuento de la cotización").fill("2.00");
  await detail.getByRole("button", { name: "Guardar cotización" }).click();
  await expect(detail.getByText(/Versión 1/)).toBeVisible();
  await detail.getByRole("tab", { name: "Solicitud" }).click();
  await status.selectOption("quoted");
  await expectQuoteStatus(request, merchantAToken, quoteA.id, "quoted");
  await page.reload();
  await expect(page.getByText(customerNameA).first()).toBeVisible();
  await page
    .getByRole("button")
    .filter({ hasText: customerNameA })
    .first()
    .click();
  await expect(detail.getByLabel("Estado de la solicitud")).toHaveValue(
    "quoted",
  );
  await expect(detail.getByText(internalNote)).toBeVisible();
  await expect(detail.getByText(followUpTitle)).toBeVisible();
  await detail.getByRole("tab", { name: "Cotización" }).click();
  await expect(detail.getByText(/Versión 1/)).toBeVisible();
  await detail.getByRole("button", { name: "Cerrar detalle" }).click();
  await page.getByRole("button", { name: "Clientes" }).first().click();
  await page
    .getByRole("button")
    .filter({ hasText: customerNameA })
    .first()
    .click();
  const customerDetail = page.getByRole("dialog", { name: customerNameA });
  await expect(
    customerDetail.getByText("Historial de solicitudes"),
  ).toBeVisible();
  await customerDetail
    .getByRole("button", { name: "Cerrar detalle del cliente" })
    .click();

  const privateProductId = `product-private-audit-${auditSuffix}`;
  const privateProduct = await request.post(
    `${firestoreBase}/products?documentId=${privateProductId}`,
    {
      headers: { Authorization: `Bearer ${merchantAToken}` },
      data: {
        fields: {
          id: { stringValue: privateProductId },
          businessId: { stringValue: "business-frutas-valle" },
          categoryId: { stringValue: "category-fruits" },
          name: { stringValue: "Producto privado de auditoría" },
          unit: { stringValue: "unidad" },
          status: { stringValue: "inactive" },
          availability: { stringValue: "unavailable" },
          isDemo: { booleanValue: true },
          createdAt: { stringValue: new Date().toISOString() },
          updatedAt: { stringValue: new Date().toISOString() },
        },
      },
    },
  );
  expect(privateProduct.status()).toBe(200);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({
    path: "artifacts/firebase/merchant-a-persisted-quote-1440x900.png",
    fullPage: true,
  });

  await request.delete("/api/auth/session");
  const merchantBToken = await login(page, merchantB);
  await expect(page).toHaveURL(/\/panel$/);
  await expect(page.getByText(customerNameA)).toHaveCount(0);
  await expect(page.getByText(customerNameB).first()).toBeVisible();
  const quoteB = await findQuote(
    request,
    merchantBToken,
    "business-la-huerta",
    customerNameB,
  );
  const merchantBReadingQuoteA = await request.get(
    `${firestoreBase}/quoteRequests/${quoteA.id}`,
    { headers: { Authorization: `Bearer ${merchantBToken}` } },
  );
  expect(merchantBReadingQuoteA.status()).toBe(403);
  const merchantBReadingCustomerA = await request.get(
    `${firestoreBase}/customers/${quoteA.customerId}`,
    { headers: { Authorization: `Bearer ${merchantBToken}` } },
  );
  expect(merchantBReadingCustomerA.status()).toBe(403);
  const merchantBReadingPrivateProductA = await request.get(
    `${firestoreBase}/products/${privateProductId}`,
    { headers: { Authorization: `Bearer ${merchantBToken}` } },
  );
  expect(merchantBReadingPrivateProductA.status()).toBe(403);
  const merchantAReadingQuoteB = await request.get(
    `${firestoreBase}/quoteRequests/${quoteB.id}`,
    { headers: { Authorization: `Bearer ${merchantAToken}` } },
  );
  expect(merchantAReadingQuoteB.status()).toBe(403);
  await page.goto("/panel?businessId=business-frutas-valle");
  await expect(page.getByText("Verduras La Huerta").first()).toBeVisible();
  await expect(page.getByText(customerNameA)).toHaveCount(0);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/panel$/);

  await request.delete("/api/auth/session");
  await login(page, admin);
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: "Resumen de la plataforma" }),
  ).toBeVisible();
  await expect(page.getByText(customerNameA)).toHaveCount(0);
  await expect(page.getByText(customerNameB)).toHaveCount(0);
  await page.goto("/panel");
  await expect(page).toHaveURL(/\/admin$/);
  await page.screenshot({
    path: "artifacts/firebase/admin-aggregate-only-1440x900.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Cerrar sesión" }).first().click();
  await expect(page).toHaveURL(/\/acceso$/);
  expect(consoleErrors).toEqual([]);
});
