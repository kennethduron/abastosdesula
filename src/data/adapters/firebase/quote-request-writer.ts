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
  const business = demoBusinesses.find(({ id }) => id === input.businessId);
  if (!business) throw new Error("Comerciante no encontrado.");
  const items = input.items.map((item) => {
    const product = demoProducts.find(({ id }) => id === item.productId);
    if (!product || product.businessId !== input.businessId) {
      throw new Error("Todos los productos deben pertenecer al comerciante.");
    }
    return {
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unit: item.unit,
    };
  });
  const db = getFirebaseAdminDb();
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
    customerType: input.customerType,
    phone: input.phone,
    ...(input.whatsapp ? { whatsapp: input.whatsapp } : {}),
    fulfillment: input.fulfillment,
    ...(input.notes ? { notes: input.notes } : {}),
    items,
    status: "new",
    history: [{ status: "new", changedAt: timestamp.toDate().toISOString() }],
    isDemo: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const batch = db.batch();
  batch.set(customerRef, {
    id: customerRef.id,
    businessId: input.businessId,
    name: input.customerName,
    type: input.customerType,
    phone: input.phone,
    whatsapp: input.whatsapp ?? null,
    notes: input.notes ?? null,
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
    businessName: business.name,
  };
}
