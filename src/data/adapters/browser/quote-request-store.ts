import "client-only";

import {
  publicQuoteRequestSchema,
  type PublicQuoteRequestInput,
  type QuoteRequest,
  type QuoteRequestItem,
} from "@/domain";

const QUOTES_KEY = "abastos-demo-quotes-v1";
const ACTIVITY_KEY = "abastos-demo-activity-v1";
const QUOTES_CHANGED_EVENT = "abastos-demo-quotes-changed";

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

function writeRequests(requests: StoredDemoQuoteRequest[]) {
  window.localStorage.setItem(QUOTES_KEY, JSON.stringify(requests));
  window.dispatchEvent(new Event(QUOTES_CHANGED_EVENT));
}

export function listStoredDemoQuoteRequests(businessId?: string) {
  const requests = readJsonArray<StoredDemoQuoteRequest>(QUOTES_KEY);
  return businessId
    ? requests.filter((request) => request.businessId === businessId)
    : requests;
}

export function getStoredDemoQuoteRequestsSnapshot() {
  return window.localStorage.getItem(QUOTES_KEY) ?? "[]";
}

export function getStoredDemoQuoteRequestsServerSnapshot() {
  return "[]";
}

export function subscribeToStoredDemoQuoteRequests(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === QUOTES_KEY) callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(QUOTES_CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(QUOTES_CHANGED_EVENT, callback);
  };
}

export function parseStoredDemoQuoteRequests(snapshot: string) {
  try {
    return JSON.parse(snapshot) as StoredDemoQuoteRequest[];
  } catch {
    return [];
  }
}

export function ensureDemoQuoteSeed() {
  if (window.localStorage.getItem(QUOTES_KEY) !== null) return;

  const now = Date.now();
  const seeds: StoredDemoQuoteRequest[] = [
    ["quote-seed-1", "Restaurante El Buen Sabor", "new", 0],
    ["quote-seed-2", "Pulpería La Esperanza", "in_review", 1],
    ["quote-seed-3", "Hotel Gran Plaza", "quoted", 2],
    ["quote-seed-4", "Comedor Doña María", "completed", 4],
  ].map(([id, customerName, status, daysAgo]) => {
    const timestamp = new Date(
      now - Number(daysAgo) * 86_400_000,
    ).toISOString();
    return {
      id: String(id),
      businessId: "business-frutas-valle",
      businessName: "Comercial Frutas del Valle",
      customerId: `customer-${id}`,
      customerName: String(customerName),
      customerType: "business",
      phone: "9999-0000",
      fulfillment: "coordinate",
      notes: "Solicitud de ejemplo para demostrar el flujo del CRM.",
      items: [
        {
          productId: "product-tomato",
          productName: "Tomate Saladette",
          quantity: 12,
          unit: "kg",
        },
      ],
      status: status as QuoteRequest["status"],
      history: [
        { status: status as QuoteRequest["status"], changedAt: timestamp },
      ],
      isDemo: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
  seeds.push({
    ...seeds[0],
    id: "quote-seed-other-business",
    businessId: "business-la-huerta",
    businessName: "Verduras La Huerta",
    customerId: "customer-other-business",
    customerName: "Cliente aislado La Huerta",
  });
  writeRequests(seeds);
}

export function updateStoredDemoQuoteRequestStatus({
  businessId,
  requestId,
  status,
}: {
  businessId: string;
  requestId: string;
  status: QuoteRequest["status"];
}) {
  const timestamp = new Date().toISOString();
  let updated: StoredDemoQuoteRequest | undefined;
  const requests = listStoredDemoQuoteRequests().map((request) => {
    if (request.id !== requestId || request.businessId !== businessId) {
      return request;
    }
    updated = {
      ...request,
      status,
      history: [...request.history, { status, changedAt: timestamp }],
      updatedAt: timestamp,
    };
    return updated;
  });
  if (!updated) return null;
  writeRequests(requests);
  return updated;
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
  writeRequests([request, ...requests]);

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
