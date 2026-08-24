"use client";

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { getFirebaseAuth } from "@/data/adapters/firebase/auth-client";
import { getFirebaseDb } from "@/data/adapters/firebase/firestore-client";
import {
  followUpSchema,
  internalNoteSchema,
  manualQuoteRequestSchema,
  quotationSchema,
  type CrmActivityEvent,
  type Customer,
  type FollowUp,
  type ManualQuoteRequestInput,
  type QuoteCommercialProposal,
  type QuoteRequest,
  type QuoteRequestStatus,
} from "@/domain";

function toIsoDate(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date().toISOString();
}

function mapQuote(data: DocumentData, id: string): QuoteRequest {
  return {
    id,
    businessId: String(data.businessId),
    customerId: String(data.customerId),
    customerName: String(data.customerName),
    company: typeof data.company === "string" ? data.company : undefined,
    customerType: data.customerType,
    phone: String(data.phone),
    whatsapp: typeof data.whatsapp === "string" ? data.whatsapp : undefined,
    source: data.source ?? "platform",
    fulfillment: data.fulfillment,
    notes: typeof data.notes === "string" ? data.notes : undefined,
    items: Array.isArray(data.items) ? data.items : [],
    status: data.status,
    history: Array.isArray(data.history) ? data.history : [],
    internalNotes: Array.isArray(data.internalNotes) ? data.internalNotes : [],
    followUps: Array.isArray(data.followUps) ? data.followUps : [],
    quotation:
      data.quotation && typeof data.quotation === "object"
        ? data.quotation
        : undefined,
    activity: Array.isArray(data.activity) ? data.activity : [],
    isDemo: true,
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
  };
}

function mapCustomer(data: DocumentData, id: string): Customer {
  return {
    id,
    businessId: String(data.businessId),
    name: String(data.name),
    company: typeof data.company === "string" ? data.company : undefined,
    type: data.type,
    phone: String(data.phone),
    whatsapp: typeof data.whatsapp === "string" ? data.whatsapp : undefined,
    notes: typeof data.notes === "string" ? data.notes : undefined,
    internalNotes: Array.isArray(data.internalNotes) ? data.internalNotes : [],
    isDemo: true,
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
  };
}

function activity(type: CrmActivityEvent["type"], description: string) {
  return {
    id: crypto.randomUUID(),
    type,
    description,
    createdAt: new Date().toISOString(),
  } satisfies CrmActivityEvent;
}

function array(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export function useFirebaseQuoteRequests(businessId: string, enabled: boolean) {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [unreadNotificationIds, setUnreadNotificationIds] = useState<string[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const unsubscribers: Array<() => void> = [];
    const auth = getFirebaseAuth();
    void auth
      .authStateReady()
      .then(() => {
        if (!active) return;
        if (!auth.currentUser) {
          setError("Tu sesión no está disponible. Inicia sesión nuevamente.");
          return;
        }
        const db = getFirebaseDb();
        unsubscribers.push(
          onSnapshot(
            query(
              collection(db, "quoteRequests"),
              where("businessId", "==", businessId),
              orderBy("createdAt", "desc"),
            ),
            (snapshot) => {
              setRequests(
                snapshot.docs.map((item) => mapQuote(item.data(), item.id)),
              );
              setError(null);
            },
            () => setError("No fue posible sincronizar las solicitudes."),
          ),
          onSnapshot(
            query(
              collection(db, "customers"),
              where("businessId", "==", businessId),
            ),
            (snapshot) =>
              setCustomers(
                snapshot.docs.map((item) => mapCustomer(item.data(), item.id)),
              ),
            () => setError("No fue posible sincronizar los clientes."),
          ),
          onSnapshot(
            query(
              collection(db, "notifications"),
              where("businessId", "==", businessId),
            ),
            (snapshot) =>
              setUnreadNotificationIds(
                snapshot.docs
                  .filter((item) => item.data().readAt == null)
                  .map((item) => item.id),
              ),
          ),
        );
      })
      .catch(() =>
        setError("No fue posible restablecer la sesión. Intenta nuevamente."),
      );
    return () => {
      active = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [businessId, enabled]);

  async function updateRequest(
    requestId: string,
    updater: (data: DocumentData) => Record<string, unknown>,
  ) {
    if (!enabled) return;
    const db = getFirebaseDb();
    await runTransaction(db, async (transaction) => {
      const reference = doc(db, "quoteRequests", requestId);
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists() || snapshot.data().businessId !== businessId) {
        throw new Error("Solicitud no disponible.");
      }
      transaction.update(reference, updater(snapshot.data()));
    });
  }

  async function updateStatus(requestId: string, status: QuoteRequestStatus) {
    const changedAt = new Date().toISOString();
    await updateRequest(requestId, (data) => ({
      status,
      updatedAt: serverTimestamp(),
      history: [...array(data.history), { status, changedAt }],
      activity: [
        ...array(data.activity),
        activity("status_changed", `Estado cambiado a ${status}`),
      ],
    }));
  }

  async function addRequestNote(requestId: string, rawBody: string) {
    const body = internalNoteSchema.parse(rawBody);
    const createdAt = new Date().toISOString();
    await updateRequest(requestId, (data) => ({
      updatedAt: serverTimestamp(),
      internalNotes: [
        ...array(data.internalNotes),
        { id: crypto.randomUUID(), body, createdAt },
      ],
      activity: [
        ...array(data.activity),
        activity("note_added", "Nota interna agregada"),
      ],
    }));
  }

  async function addCustomerNote(customerId: string, rawBody: string) {
    if (!enabled) return;
    const body = internalNoteSchema.parse(rawBody);
    const db = getFirebaseDb();
    await runTransaction(db, async (transaction) => {
      const reference = doc(db, "customers", customerId);
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists() || snapshot.data().businessId !== businessId) {
        throw new Error("Cliente no disponible.");
      }
      transaction.update(reference, {
        internalNotes: [
          ...array(snapshot.data().internalNotes),
          {
            id: crypto.randomUUID(),
            body,
            createdAt: new Date().toISOString(),
          },
        ],
        updatedAt: serverTimestamp(),
      });
    });
  }

  async function addFollowUp(
    requestId: string,
    rawInput: { title: string; dueAt: string; note?: string },
  ) {
    const input = followUpSchema.parse(rawInput);
    await updateRequest(requestId, (data) => ({
      updatedAt: serverTimestamp(),
      followUps: [
        ...array(data.followUps),
        {
          id: crypto.randomUUID(),
          title: input.title,
          dueAt: input.dueAt,
          ...(input.note ? { note: input.note } : {}),
          status: "pending",
        },
      ],
      activity: [
        ...array(data.activity),
        activity("follow_up_created", "Seguimiento programado"),
      ],
    }));
  }

  async function toggleFollowUp(requestId: string, followUpId: string) {
    await updateRequest(requestId, (data) => {
      const followUps = array(data.followUps) as FollowUp[];
      const current = followUps.find((item) => item.id === followUpId);
      if (!current) return {};
      const completed = current.status !== "completed";
      return {
        updatedAt: serverTimestamp(),
        followUps: followUps.map((item) =>
          item.id === followUpId
            ? {
                ...item,
                status: completed ? "completed" : "pending",
                completedAt: completed ? new Date().toISOString() : null,
              }
            : item,
        ),
        activity: [
          ...array(data.activity),
          activity(
            "follow_up_completed",
            completed ? "Seguimiento completado" : "Seguimiento reabierto",
          ),
        ],
      };
    });
  }

  async function saveQuotation(requestId: string, rawInput: unknown) {
    const input = quotationSchema.parse(rawInput);
    await updateRequest(requestId, (data) => {
      const lines = input.lines.map((line) => ({
        ...line,
        subtotalMinor: Math.round(line.quantity * line.unitPriceMinor),
      }));
      const subtotal = lines.reduce(
        (total, line) => total + line.subtotalMinor,
        0,
      );
      const quotation: QuoteCommercialProposal = {
        lines,
        discountMinor: input.discountMinor,
        ...(input.note ? { note: input.note } : {}),
        totalMinor: Math.max(0, subtotal - input.discountMinor),
        updatedAt: new Date().toISOString(),
        version:
          typeof data.quotation?.version === "number"
            ? data.quotation.version + 1
            : 1,
      };
      return {
        quotation,
        updatedAt: serverTimestamp(),
        activity: [
          ...array(data.activity),
          activity("quotation_updated", "Cotización actualizada"),
        ],
      };
    });
  }

  async function createManualRequest(rawInput: ManualQuoteRequestInput) {
    if (!enabled) return;
    const input = manualQuoteRequestSchema.parse(rawInput);
    if (input.businessId !== businessId) throw new Error("Negocio no válido.");
    const db = getFirebaseDb();
    const requestReference = doc(collection(db, "quoteRequests"));
    const customerReference = input.customerId
      ? doc(db, "customers", input.customerId)
      : doc(collection(db, "customers"));
    const createdAt = new Date().toISOString();
    const batch = writeBatch(db);
    if (!input.customerId) {
      batch.set(customerReference, {
        id: customerReference.id,
        businessId,
        name: input.customerName,
        ...(input.company ? { company: input.company } : {}),
        type: input.customerType,
        phone: input.phone,
        ...(input.whatsapp ? { whatsapp: input.whatsapp } : {}),
        internalNotes: [],
        isDemo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    batch.set(requestReference, {
      id: requestReference.id,
      businessId,
      customerId: customerReference.id,
      customerName: input.customerName,
      ...(input.company ? { company: input.company } : {}),
      customerType: input.customerType,
      phone: input.phone,
      ...(input.whatsapp ? { whatsapp: input.whatsapp } : {}),
      source: input.source,
      fulfillment: input.fulfillment,
      ...(input.notes ? { notes: input.notes } : {}),
      items: input.items,
      status: input.status,
      history: [{ status: input.status, changedAt: createdAt }],
      internalNotes: [],
      followUps: [],
      activity: [
        activity("request_created", "Solicitud registrada por el comerciante"),
      ],
      isDemo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    return requestReference.id;
  }

  async function markNotificationsRead() {
    if (!enabled) return;
    await Promise.all(
      unreadNotificationIds.map((id) =>
        updateDoc(doc(getFirebaseDb(), "notifications", id), {
          readAt: serverTimestamp(),
        }),
      ),
    );
  }

  return {
    requests,
    customers,
    unreadCount: unreadNotificationIds.length,
    error,
    updateStatus,
    addRequestNote,
    addCustomerNote,
    addFollowUp,
    toggleFollowUp,
    saveQuotation,
    createManualRequest,
    markNotificationsRead,
  };
}
