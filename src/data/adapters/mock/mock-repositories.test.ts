import { describe, expect, it } from "vitest";

import { addItemToCart, publicQuoteRequestSchema, type Cart } from "@/domain";
import { createMockRepositories } from "@/data/adapters/mock";

describe("mock commerce repositories", () => {
  it("filters merchants by normalized search and category", async () => {
    const repositories = createMockRepositories();

    const bySearch = await repositories.merchants.list({ search: "lacteos" });
    const byCategory = await repositories.merchants.list({
      categoryId: "category-grains",
    });

    expect(bySearch.map(({ slug }) => slug)).toEqual(["lacteos-la-esperanza"]);
    expect(byCategory).toHaveLength(2);
  });

  it("paginates product queries without returning an unbounded catalog", async () => {
    const repositories = createMockRepositories();

    const result = await repositories.products.list({ page: 1, pageSize: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBeGreaterThan(result.items.length);
    expect(result.totalPages).toBeGreaterThan(1);
  });

  it("does not mix cart items from different businesses", () => {
    const cart: Cart = {
      businessId: "business-frutas-valle",
      items: [],
      updatedAt: "2026-08-22T00:00:00.000Z",
    };

    const result = addItemToCart(cart, {
      productId: "product-cabbage",
      businessId: "business-la-huerta",
      businessName: "Verduras La Huerta",
      whatsappDemo: "50400000000",
      productName: "Repollo Verde",
      image: "/images/home/product-cabbage.webp",
      imageAlt: "Repollo verde",
      priceMinor: 600,
      unit: "unidad",
      quantity: 1,
    });

    expect(result.outcome).toBe("business_conflict");
    expect(result.cart).toEqual(cart);
  });

  it("rejects extra fields in the public quote payload", () => {
    const result = publicQuoteRequestSchema.safeParse({
      businessId: "business-frutas-valle",
      customerName: "Cliente Demo",
      customerType: "business",
      phone: "99990000",
      fulfillment: "coordinate",
      items: [{ productId: "product-tomato", quantity: 2, unit: "kg" }],
      role: "institutional_admin",
    });

    expect(result.success).toBe(false);
  });

  it("enforces business ownership when creating and reading requests", async () => {
    const repositories = createMockRepositories();
    const request = await repositories.quoteRequests.create({
      businessId: "business-frutas-valle",
      customerName: "Cliente Demo",
      customerType: "restaurant",
      phone: "99990000",
      fulfillment: "coordinate",
      items: [{ productId: "product-tomato", quantity: 4, unit: "kg" }],
    });

    await expect(
      repositories.quoteRequests.getById("business-la-huerta", request.id),
    ).resolves.toBeNull();
    await expect(
      repositories.quoteRequests.create({
        businessId: "business-la-huerta",
        customerName: "Cliente Demo",
        customerType: "restaurant",
        phone: "99990000",
        fulfillment: "coordinate",
        items: [{ productId: "product-tomato", quantity: 4, unit: "kg" }],
      }),
    ).rejects.toThrow("mismo negocio");
  });
});
