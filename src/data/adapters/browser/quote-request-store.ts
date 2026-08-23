import "client-only";

import {
  publicQuoteRequestSchema,
  type PublicQuoteRequestInput,
  type QuoteRequest,
  type QuoteRequestItem,
} from "@/domain";

const QUOTES_KEY = "abastos-demo-quotes-v1";
const ACTIVITY_KEY = "abastos-demo-activity-v1";

export interface StoredDemoQuoteRequest extends QuoteRequest {
  businessName: string;
}

function readJsonArray<T>(key: string): T[] {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T[]) : [];
  } catch {
    return [];
  }
}

export function listStoredDemoQuoteRequests() {
  return readJsonArray<StoredDemoQuoteRequest>(QUOTES_KEY);
}

export function saveDemoQuoteRequest({
  input: rawInput,
  businessName,
  items,
}: {
  input: PublicQuoteRequestInput;
  businessName: string;
  items: QuoteRequestItem[];
}) {
  const input = publicQuoteRequestSchema.parse(rawInput);
  const timestamp = new Date().toISOString();
  const id = `quote-demo-${crypto.randomUUID()}`;
  const request: StoredDemoQuoteRequest = {
    id,
    businessId: input.businessId,
    businessName,
    customerId: `customer-demo-${crypto.randomUUID()}`,
    customerName: input.customerName,
    customerType: input.customerType,
    phone: input.phone,
    whatsapp: input.whatsapp,
    fulfillment: input.fulfillment,
    notes: input.notes,
    items,
    status: "new",
    history: [{ status: "new", changedAt: timestamp }],
    isDemo: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const requests = listStoredDemoQuoteRequests();
  window.localStorage.setItem(
    QUOTES_KEY,
    JSON.stringify([request, ...requests]),
  );

  const activities = readJsonArray<Record<string, unknown>>(ACTIVITY_KEY);
  window.localStorage.setItem(
    ACTIVITY_KEY,
    JSON.stringify([
      {
        id: `activity-demo-${crypto.randomUUID()}`,
        businessId: request.businessId,
        type: "quote_request_created",
        description: `Nueva solicitud demo de ${request.customerName}`,
        entityType: "quote_request",
        entityId: request.id,
        createdAt: timestamp,
      },
      ...activities,
    ]),
  );

  return request;
}
