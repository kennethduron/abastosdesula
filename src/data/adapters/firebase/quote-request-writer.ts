import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import { demoBusinesses, demoProducts } from "@/data/adapters/mock/demo-data";
import { getFirebaseAdminDb } from "@/data/adapters/firebase/admin";
import {
  publicQuoteRequestSchema,
  type PublicQuoteRequestInput,
  type QuoteRequest,
} from "@/domain";

export async function createFirebaseQuoteRequest(
  rawInput: PublicQuoteRequestInput,
) {
  const input = publicQuoteRequestSchema.parse(rawInput);
  const db = getFirebaseAdminDb();
  const demoBusiness = demoBusinesses.find(({ id }) => id === input.businessId);
  const businessSnapshot = demoBusiness
    ? null
    : await db.collection("businesses").doc(input.businessId).get();
  const businessData = businessSnapshot?.data();
  if (
    !demoBusiness &&
    (!businessSnapshot?.exists ||
      businessData?.status !== "active" ||
      businessData?.published === false)
  ) {
    throw new Error("Comerciante no encontrado.");
  }
  const items = await Promise.all(
    input.items.map(async (item) => {
      const demoProduct = demoProducts.find(({ id }) => id === item.productId);
      const productSnapshot = demoProduct
        ? null
        : await db.collection("products").doc(item.productId).get();
      const productData = productSnapshot?.data();
      const businessId = demoProduct?.businessId ?? productData?.businessId;
      const productVisible =
        Boolean(demoProduct) ||
        (productSnapshot?.exists &&
          productData?.status === "active" &&
          productData?.published !== false);
      if (!productVisible || businessId !== input.businessId) {
        throw new Error("Todos los productos deben pertenecer al comerciante.");
      }
      return {
        productId: demoProduct?.id ?? item.productId,
        productName:
          demoProduct?.name ?? String(productData?.name ?? "Producto"),
        quantity: item.quantity,
        unit: demoProduct?.unit ?? String(productData?.unit ?? item.unit),
        image:
          demoProduct?.image ??
          String(productData?.image ?? "/images/home/hero-market.webp"),
        imageAlt:
          demoProduct?.imageAlt ??
          String(productData?.imageAlt ?? productData?.name ?? "Producto"),
        referencePriceMinor:
          demoProduct?.referencePrice.amountMinor ??
          Math.max(
            0,
            Number(
              productData?.priceMinor ??
                productData?.referencePrice?.amountMinor ??
                0,
            ),
          ),
      };
    }),
  );
  const quoteRef = db.collection("quoteRequests").doc();
  const customerRef = db.collection("customers").doc();
  const activityRef = db.collection("activities").doc();
  const notificationRef = db.collection("notifications").doc();
  const timestamp = Timestamp.now();
  const request: Omit<QuoteRequest, "createdAt" | "updatedAt"> & {
    createdAt: Timestamp;
    updatedAt: Timestamp;
  } = {
    id: quoteRef.id,
    businessId: input.businessId,
    customerId: customerRef.id,
    customerName: input.customerName,
    ...(input.company ? { company: input.company } : {}),
    customerType: input.customerType,
    phone: input.phone,
    ...(input.whatsapp ? { whatsapp: input.whatsapp } : {}),
    source: "platform",
    fulfillment: input.fulfillment,
    ...(input.notes ? { notes: input.notes } : {}),
    items,
    status: "new",
    history: [{ status: "new", changedAt: timestamp.toDate().toISOString() }],
    internalNotes: [],
    followUps: [],
    activity: [
      {
        id: `created-${quoteRef.id}`,
        type: "request_created",
        description: "Solicitud creada desde la plataforma",
        createdAt: timestamp.toDate().toISOString(),
      },
    ],
    isDemo: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const batch = db.batch();
  batch.set(customerRef, {
    id: customerRef.id,
    businessId: input.businessId,
    name: input.customerName,
    ...(input.company ? { company: input.company } : {}),
    type: input.customerType,
    phone: input.phone,
    whatsapp: input.whatsapp ?? null,
    notes: input.notes ?? null,
    internalNotes: [],
    isDemo: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  batch.set(quoteRef, request);
  batch.set(activityRef, {
    id: activityRef.id,
    businessId: input.businessId,
    type: "quote_request_created",
    entityType: "quote_request",
    entityId: quoteRef.id,
    description: "Nueva solicitud recibida",
    isDemo: true,
    createdAt: timestamp,
  });
  batch.set(notificationRef, {
    id: notificationRef.id,
    businessId: input.businessId,
    type: "quote_request_created",
    title: "Nueva solicitud",
    body: "Hay una nueva solicitud pendiente de revisión.",
    entityType: "quote_request",
    entityId: quoteRef.id,
    readAt: null,
    isDemo: true,
    createdAt: timestamp,
  });
  await batch.commit();
  return {
    id: quoteRef.id,
    status: "new" as const,
    businessName:
      demoBusiness?.name ?? String(businessData?.name ?? "Comercio"),
  };
}
