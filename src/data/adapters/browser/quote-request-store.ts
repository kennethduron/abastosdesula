import "client-only";

import {
  followUpSchema,
  internalNoteSchema,
  manualQuoteRequestSchema,
  publicQuoteRequestSchema,
  quotationSchema,
  type CrmActivityType,
  type Customer,
  type FollowUp,
  type ManualQuoteRequestInput,
  type PublicQuoteRequestInput,
  type QuoteCommercialProposal,
  type QuoteRequest,
  type QuoteRequestItem,
  type QuoteRequestStatus,
} from "@/domain";

const QUOTES_KEY = "abastos-demo-quotes-v2";
const CUSTOMERS_KEY = "abastos-demo-customers-v2";
const ACTIVITY_KEY = "abastos-demo-activity-v2";
const CRM_CHANGED_EVENT = "abastos-demo-crm-changed";

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

function emitChange() {
  window.dispatchEvent(new Event(CRM_CHANGED_EVENT));
}

function writeRequests(requests: StoredDemoQuoteRequest[]) {
  window.localStorage.setItem(QUOTES_KEY, JSON.stringify(requests));
  emitChange();
}

function writeCustomers(customers: Customer[]) {
  window.localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  emitChange();
}

function appendActivity<T extends QuoteRequest>(
  request: T,
  type: CrmActivityType,
  description: string,
) {
  const createdAt = new Date().toISOString();
  return {
    ...request,
    updatedAt: createdAt,
    activity: [
      ...(request.activity ?? []),
      { id: crypto.randomUUID(), type, description, createdAt },
    ],
  } satisfies T & Pick<QuoteRequest, "updatedAt" | "activity">;
}

export function listStoredDemoQuoteRequests(businessId?: string) {
  const requests = readJsonArray<StoredDemoQuoteRequest>(QUOTES_KEY);
  return businessId
    ? requests.filter((request) => request.businessId === businessId)
    : requests;
}

export function listStoredDemoCustomers(businessId?: string) {
  const customers = readJsonArray<Customer>(CUSTOMERS_KEY);
  return businessId
    ? customers.filter((customer) => customer.businessId === businessId)
    : customers;
}

export function getStoredDemoQuoteRequestsSnapshot() {
  return window.localStorage.getItem(QUOTES_KEY) ?? "[]";
}

export function getStoredDemoCustomersSnapshot() {
  return window.localStorage.getItem(CUSTOMERS_KEY) ?? "[]";
}

export function getStoredDemoQuoteRequestsServerSnapshot() {
  return "[]";
}

export function subscribeToStoredDemoQuoteRequests(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === QUOTES_KEY || event.key === CUSTOMERS_KEY) callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CRM_CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CRM_CHANGED_EVENT, callback);
  };
}

export function parseStoredDemoQuoteRequests(snapshot: string) {
  try {
    return JSON.parse(snapshot) as StoredDemoQuoteRequest[];
  } catch {
    return [];
  }
}

export function parseStoredDemoCustomers(snapshot: string) {
  try {
    return JSON.parse(snapshot) as Customer[];
  } catch {
    return [];
  }
}

export function ensureDemoQuoteSeed() {
  if (window.localStorage.getItem(QUOTES_KEY) !== null) return;

  const now = Date.now();
  const seeds: StoredDemoQuoteRequest[] = [
    ["quote-seed-1", "Restaurante El Buen Sabor", "new", 0, 12],
    ["quote-seed-2", "Pulpería La Esperanza", "in_review", 1, 18],
    ["quote-seed-3", "Hotel Gran Plaza", "quoted", 2, 30],
    ["quote-seed-4", "Comedor Doña María", "completed", 4, 20],
  ].map(([id, customerName, status, daysAgo, quantity]) => {
    const timestamp = new Date(
      now - Number(daysAgo) * 86_400_000,
    ).toISOString();
    const requestId = String(id);
    return {
      id: requestId,
      businessId: "business-frutas-valle",
      businessName: "Comercial Frutas del Valle",
      customerId: `customer-${requestId}`,
      customerName: String(customerName),
      company: String(customerName),
      customerType: "business",
      phone: "9999-0000",
      whatsapp: "50499990000",
      source: requestId === "quote-seed-2" ? "phone" : "platform",
      fulfillment: "coordinate",
      notes: "Consulta de disponibilidad y precio por volumen.",
      items: [
        {
          productId: "product-tomato",
          productName: "Tomate Saladette",
          quantity: Number(quantity),
          unit: "kg",
          referencePriceMinor: 1200,
          image: "/images/home/product-tomato.webp",
          imageAlt: "Tomate Saladette",
        },
      ],
      status: status as QuoteRequestStatus,
      history: [{ status: status as QuoteRequestStatus, changedAt: timestamp }],
      internalNotes: [],
      followUps:
        requestId === "quote-seed-2"
          ? [
              {
                id: "follow-up-seed",
                title: "Confirmar volumen requerido",
                dueAt: new Date(now + 86_400_000).toISOString(),
                status: "pending",
              },
            ]
          : [],
      quotation:
        status === "quoted" || status === "completed"
          ? {
              lines: [
                {
                  productId: "product-tomato",
                  productName: "Tomate Saladette",
                  quantity: Number(quantity),
                  unit: "kg",
                  unitPriceMinor: 1150,
                  subtotalMinor: Number(quantity) * 1150,
                },
              ],
              discountMinor: 0,
              totalMinor: Number(quantity) * 1150,
              updatedAt: timestamp,
              version: 1,
            }
          : undefined,
      activity: [
        {
          id: `activity-${requestId}`,
          type: "request_created",
          description: "Solicitud registrada",
          createdAt: timestamp,
        },
      ],
      isDemo: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    } satisfies StoredDemoQuoteRequest;
  });
  seeds.push({
    ...seeds[0],
    id: "quote-seed-other-business",
    businessId: "business-la-huerta",
    businessName: "Verduras La Huerta",
    customerId: "customer-other-business",
    customerName: "Cliente aislado La Huerta",
    company: "Cliente aislado La Huerta",
  });
  const customers: Customer[] = seeds.map((request) => ({
    id: request.customerId,
    businessId: request.businessId,
    name: request.customerName,
    company: request.company,
    type: request.customerType,
    phone: request.phone,
    whatsapp: request.whatsapp,
    internalNotes: [],
    isDemo: true,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  }));
  window.localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  writeRequests(seeds);
}

function updateRequest(
  businessId: string,
  requestId: string,
  updater: (request: StoredDemoQuoteRequest) => StoredDemoQuoteRequest,
) {
  let updated: StoredDemoQuoteRequest | undefined;
  const requests = listStoredDemoQuoteRequests().map((request) => {
    if (request.id !== requestId || request.businessId !== businessId) {
      return request;
    }
    updated = updater(request);
    return updated;
  });
  if (!updated) return null;
  writeRequests(requests);
  return updated;
}

export function updateStoredDemoQuoteRequestStatus({
  businessId,
  requestId,
  status,
}: {
  businessId: string;
  requestId: string;
  status: QuoteRequestStatus;
}) {
  const changedAt = new Date().toISOString();
  return updateRequest(businessId, requestId, (request) => ({
    ...appendActivity(request, "status_changed", `Estado cambiado a ${status}`),
    status,
    history: [...request.history, { status, changedAt }],
    updatedAt: changedAt,
  }));
}

export function addStoredRequestNote(
  businessId: string,
  requestId: string,
  rawBody: string,
) {
  const body = internalNoteSchema.parse(rawBody);
  const createdAt = new Date().toISOString();
  return updateRequest(businessId, requestId, (request) => ({
    ...appendActivity(request, "note_added", "Nota interna agregada"),
    internalNotes: [
      ...(request.internalNotes ?? []),
      { id: crypto.randomUUID(), body, createdAt },
    ],
  }));
}

export function addStoredCustomerNote(
  businessId: string,
  customerId: string,
  rawBody: string,
) {
  const body = internalNoteSchema.parse(rawBody);
  const createdAt = new Date().toISOString();
  let updated: Customer | undefined;
  const customers = listStoredDemoCustomers().map((customer) => {
    if (customer.id !== customerId || customer.businessId !== businessId) {
      return customer;
    }
    updated = {
      ...customer,
      internalNotes: [
        ...(customer.internalNotes ?? []),
        { id: crypto.randomUUID(), body, createdAt },
      ],
      updatedAt: createdAt,
    };
    return updated;
  });
  if (!updated) return null;
  writeCustomers(customers);
  return updated;
}

export function addStoredFollowUp(
  businessId: string,
  requestId: string,
  rawInput: { title: string; dueAt: string; note?: string },
) {
  const input = followUpSchema.parse(rawInput);
  return updateRequest(businessId, requestId, (request) => ({
    ...appendActivity(request, "follow_up_created", "Seguimiento programado"),
    followUps: [
      ...(request.followUps ?? []),
      { id: crypto.randomUUID(), ...input, status: "pending" },
    ],
  }));
}

export function toggleStoredFollowUp(
  businessId: string,
  requestId: string,
  followUpId: string,
) {
  return updateRequest(businessId, requestId, (request) => {
    const current = request.followUps?.find((item) => item.id === followUpId);
    if (!current) return request;
    const completed = current.status !== "completed";
    const followUps: FollowUp[] = (request.followUps ?? []).map((item) =>
      item.id === followUpId
        ? {
            ...item,
            status: completed ? "completed" : "pending",
            completedAt: completed ? new Date().toISOString() : undefined,
          }
        : item,
    );
    return {
      ...appendActivity(
        request,
        "follow_up_completed",
        completed ? "Seguimiento completado" : "Seguimiento reabierto",
      ),
      followUps,
    };
  });
}

export function saveStoredQuotation(
  businessId: string,
  requestId: string,
  rawInput: unknown,
) {
  const input = quotationSchema.parse(rawInput);
  return updateRequest(businessId, requestId, (request) => {
    const updatedAt = new Date().toISOString();
    const lines = input.lines.map((line) => ({
      ...line,
      subtotalMinor: Math.round(line.quantity * line.unitPriceMinor),
    }));
    const subtotal = lines.reduce(
      (total, line) => total + line.subtotalMinor,
      0,
    );
    const quotation: QuoteCommercialProposal = {
      ...input,
      lines,
      totalMinor: Math.max(0, subtotal - input.discountMinor),
      updatedAt,
      version: (request.quotation?.version ?? 0) + 1,
    };
    return {
      ...appendActivity(request, "quotation_updated", "Cotización actualizada"),
      quotation,
      updatedAt,
    };
  });
}

export function createStoredManualQuoteRequest(
  rawInput: ManualQuoteRequestInput,
  businessName: string,
) {
  const input = manualQuoteRequestSchema.parse(rawInput);
  const createdAt = new Date().toISOString();
  const customerId = input.customerId ?? `customer-${crypto.randomUUID()}`;
  const request: StoredDemoQuoteRequest = {
    id: `quote-${crypto.randomUUID()}`,
    businessId: input.businessId,
    businessName,
    customerId,
    customerName: input.customerName,
    company: input.company,
    customerType: input.customerType,
    phone: input.phone,
    whatsapp: input.whatsapp,
    source: input.source,
    fulfillment: input.fulfillment,
    notes: input.notes,
    items: input.items,
    status: input.status,
    history: [{ status: input.status, changedAt: createdAt }],
    internalNotes: [],
    followUps: [],
    activity: [
      {
        id: crypto.randomUUID(),
        type: "request_created",
        description: "Solicitud registrada por el comerciante",
        createdAt,
      },
    ],
    isDemo: true,
    createdAt,
    updatedAt: createdAt,
  };
  if (!input.customerId) {
    const customer: Customer = {
      id: customerId,
      businessId: input.businessId,
      name: input.customerName,
      company: input.company,
      type: input.customerType,
      phone: input.phone,
      whatsapp: input.whatsapp,
      internalNotes: [],
      isDemo: true,
      createdAt,
      updatedAt: createdAt,
    };
    writeCustomers([customer, ...listStoredDemoCustomers()]);
  }
  writeRequests([request, ...listStoredDemoQuoteRequests()]);
  return request;
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
  const createdAt = new Date().toISOString();
  const customerId = `customer-${crypto.randomUUID()}`;
  const request: StoredDemoQuoteRequest = {
    id: `quote-${crypto.randomUUID()}`,
    businessId: input.businessId,
    businessName,
    customerId,
    customerName: input.customerName,
    company: input.company,
    customerType: input.customerType,
    phone: input.phone,
    whatsapp: input.whatsapp,
    source: "platform",
    fulfillment: input.fulfillment,
    notes: input.notes,
    items,
    status: "new",
    history: [{ status: "new", changedAt: createdAt }],
    internalNotes: [],
    followUps: [],
    activity: [
      {
        id: crypto.randomUUID(),
        type: "request_created",
        description: "Solicitud creada desde la plataforma",
        createdAt,
      },
    ],
    isDemo: true,
    createdAt,
    updatedAt: createdAt,
  };
  const customer: Customer = {
    id: customerId,
    businessId: input.businessId,
    name: input.customerName,
    company: input.company,
    type: input.customerType,
    phone: input.phone,
    whatsapp: input.whatsapp,
    notes: input.notes,
    internalNotes: [],
    isDemo: true,
    createdAt,
    updatedAt: createdAt,
  };
  writeCustomers([customer, ...listStoredDemoCustomers()]);
  writeRequests([request, ...listStoredDemoQuoteRequests()]);

  const activities = readJsonArray<Record<string, unknown>>(ACTIVITY_KEY);
  window.localStorage.setItem(
    ACTIVITY_KEY,
    JSON.stringify([
      {
        id: `activity-${crypto.randomUUID()}`,
        businessId: request.businessId,
        type: "quote_request_created",
        description: "Nueva solicitud recibida",
        entityType: "quote_request",
        entityId: request.id,
        createdAt,
      },
      ...activities,
    ]),
  );
  return request;
}
