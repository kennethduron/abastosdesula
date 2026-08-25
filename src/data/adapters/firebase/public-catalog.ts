import "server-only";

import type { Business, Merchant, Product } from "@/domain";
import {
  demoBusinesses,
  demoMerchants,
  demoProducts,
} from "@/data/adapters/mock/demo-data";
import { isFirebaseAdminConfigured } from "@/data/adapters/firebase/admin-config";

const fallbackImage = "/images/home/hero-market.webp";
const timestamp = "2026-08-24T00:00:00.000Z";
const demoBusinessById = new Map(
  demoBusinesses.map((business) => [business.id, business]),
);
const demoMerchantById = new Map(
  demoMerchants.map((merchant) => [merchant.id, merchant]),
);
const demoProductById = new Map(
  demoProducts.map((product) => [product.id, product]),
);

function visible(data: FirebaseFirestore.DocumentData) {
  return data.status === "active" && data.published !== false;
}

function mergeById<T extends { id: string }>(base: T[], additions: T[]) {
  const values = new Map(base.map((item) => [item.id, item]));
  for (const item of additions) values.set(item.id, item);
  return [...values.values()];
}

export async function getPublicCatalog() {
  if (!isFirebaseAdminConfigured()) {
    return {
      businesses: demoBusinesses,
      merchants: demoMerchants,
      products: demoProducts,
    };
  }
  try {
    const { getFirebaseAdminDb } =
      await import("@/data/adapters/firebase/admin");
    const db = getFirebaseAdminDb();
    const [businessSnapshot, merchantSnapshot, productSnapshot] =
      await Promise.all([
        db
          .collection("businesses")
          .where("status", "==", "active")
          .limit(250)
          .get(),
        db
          .collection("merchants")
          .where("status", "==", "active")
          .limit(250)
          .get(),
        db
          .collection("products")
          .where("status", "==", "active")
          .limit(500)
          .get(),
      ]);
    const businesses: Business[] = businessSnapshot.docs
      .filter((item) => visible(item.data()))
      .map((item) => {
        const data = item.data();
        const fallback = demoBusinessById.get(item.id);
        return {
          id: item.id,
          name: String(data.name ?? fallback?.name ?? "Comercio"),
          slug: String(data.slug ?? fallback?.slug ?? item.id),
          status: "active",
          isDemo: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
      });
    const visibleBusinessIds = new Set(businesses.map((item) => item.id));
    const merchants: Merchant[] = merchantSnapshot.docs
      .filter(
        (item) =>
          visible(item.data()) &&
          visibleBusinessIds.has(String(item.data().businessId)),
      )
      .map((item) => {
        const data = item.data();
        const fallback = demoMerchantById.get(item.id);
        return {
          id: item.id,
          businessId: String(data.businessId),
          slug: String(data.slug ?? fallback?.slug ?? item.id),
          displayName: String(
            data.displayName ?? fallback?.displayName ?? "Comercio",
          ),
          description: String(
            data.description ??
              fallback?.description ??
              "Información comercial disponible.",
          ),
          categoryIds: Array.isArray(data.categoryIds)
            ? data.categoryIds.map(String).slice(0, 10)
            : (fallback?.categoryIds ?? []),
          featuredProductIds: Array.isArray(data.featuredProductIds)
            ? data.featuredProductIds.map(String).slice(0, 20)
            : (fallback?.featuredProductIds ?? []),
          image: String(data.image ?? fallback?.image ?? fallbackImage),
          imageAlt: String(
            data.imageAlt ??
              fallback?.imageAlt ??
              data.displayName ??
              "Comercio",
          ),
          whatsappDemo:
            typeof data.whatsappDemo === "string"
              ? data.whatsappDemo
              : fallback?.whatsappDemo,
          verificationLabel: "demo",
          status: "active",
          isDemo: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
      });
    const products: Product[] = productSnapshot.docs
      .filter(
        (item) =>
          visible(item.data()) &&
          visibleBusinessIds.has(String(item.data().businessId)),
      )
      .map((item) => {
        const data = item.data();
        const fallback = demoProductById.get(item.id);
        const stock = Number(
          data.stock ?? (fallback?.availability === "unavailable" ? 0 : 1),
        );
        return {
          id: item.id,
          businessId: String(data.businessId),
          categoryId: String(
            data.categoryId ?? fallback?.categoryId ?? "category-groceries",
          ),
          name: String(data.name ?? fallback?.name ?? "Producto"),
          slug: String(data.slug ?? fallback?.slug ?? item.id),
          description: String(
            data.description ??
              fallback?.description ??
              "Producto disponible para cotización.",
          ),
          image: String(data.image ?? fallback?.image ?? fallbackImage),
          imageAlt: String(
            data.imageAlt ?? fallback?.imageAlt ?? data.name ?? "Producto",
          ),
          unit: String(data.unit ?? fallback?.unit ?? "unidad"),
          referencePrice: {
            amountMinor: Math.max(
              0,
              Number(
                data.priceMinor ??
                  data.referencePrice?.amountMinor ??
                  fallback?.referencePrice.amountMinor ??
                  0,
              ),
            ),
            currency: "HNL",
          },
          availability:
            stock === 0
              ? "unavailable"
              : data.availability === "limited" ||
                  (data.availability === undefined &&
                    fallback?.availability === "limited")
                ? "limited"
                : "available",
          featured: data.featured === true || fallback?.featured === true,
          isDemo: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
      });
    return {
      businesses: mergeById(demoBusinesses, businesses),
      merchants: mergeById(demoMerchants, merchants),
      products: mergeById(demoProducts, products),
    };
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String(error.code)
        : "unknown";
    console.error("[public-catalog] read failed", { code });
    return {
      businesses: demoBusinesses,
      merchants: demoMerchants,
      products: demoProducts,
    };
  }
}
