import { expect, test } from "@playwright/test";

test("exposes a complete installable manifest and PWA metadata", async ({
  page,
  request,
}) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    name: "Central de Abastos de Sula",
    short_name: "Abastos de Sula",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#071a33",
  });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192", purpose: "any" }),
      expect.objectContaining({ sizes: "512x512", purpose: "any" }),
      expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
    ]),
  );
  for (const [path, size] of [
    ["/icons/icon-192.png", 192],
    ["/icons/icon-512.png", 512],
    ["/icons/maskable-512.png", 512],
    ["/icons/apple-touch-icon.png", 180],
  ] as const) {
    const icon = await request.get(path);
    expect(icon.ok()).toBe(true);
    expect(icon.headers()["content-type"]).toContain("image/png");
    const body = await icon.body();
    expect(body.readUInt32BE(16)).toBe(size);
    expect(body.readUInt32BE(20)).toBe(size);
  }

  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#071a33",
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/icons/apple-touch-icon.png",
  );
});

test("registers a controlled service worker with secure response headers", async ({
  page,
  request,
}) => {
  const workerResponse = await request.get("/sw.js");
  expect(workerResponse.ok()).toBe(true);
  expect(workerResponse.headers()["content-type"]).toContain(
    "application/javascript",
  );
  expect(workerResponse.headers()["cache-control"]).toContain("no-store");
  expect(workerResponse.headers()["service-worker-allowed"]).toBe("/");

  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);

  const cdp = await page.context().newCDPSession(page);
  const appManifest = await cdp.send("Page.getAppManifest");
  expect(appManifest.url).toContain("/manifest.webmanifest");
  expect(appManifest.errors).toEqual([]);
});

test("keeps private and API routes outside all PWA caches", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.goto("/panel");
  await page.goto("/admin");
  await page.goto("/acceso");

  const cachedUrls = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const key of await caches.keys()) {
      for (const request of await (await caches.open(key)).keys()) {
        urls.push(new URL(request.url).pathname);
      }
    }
    return urls;
  });
  expect(
    cachedUrls.filter((url) =>
      /^\/(api(?:\/|$)|panel(?:\/|$)|admin(?:\/|$)|acceso(?:\/|$))/.test(url),
    ),
  ).toEqual([]);
});

test("serves the public Home offline after the shell is installed", async ({
  context,
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: "networkidle" });
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Productos frescos, comerciantes de confianza/i,
      }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/comerciantes/contenido-no-cacheado");
    await expect(
      page.getByRole("heading", { name: "Estás sin conexión" }),
    ).toBeVisible();
    await page.screenshot({
      path: "artifacts/pwa/offline-fallback-390x844.png",
      fullPage: true,
    });
  } finally {
    await context.setOffline(false);
  }
});

test("captures the PWA shell on mobile and desktop", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.screenshot({
      path: `artifacts/pwa/home-${viewport.width}x${viewport.height}.png`,
      fullPage: false,
    });
  }
});
