"use client";

import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { getFirebaseAuth } from "@/data/adapters/firebase/auth-client";
import { getFirebaseDb } from "@/data/adapters/firebase/firestore-client";
import type { QuoteRequest, QuoteRequestStatus } from "@/domain";

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
    customerType: data.customerType,
    phone: String(data.phone),
    whatsapp: typeof data.whatsapp === "string" ? data.whatsapp : undefined,
    fulfillment: data.fulfillment,
    notes: typeof data.notes === "string" ? data.notes : undefined,
    items: Array.isArray(data.items) ? data.items : [],
    status: data.status,
    history: Array.isArray(data.history) ? data.history : [],
    isDemo: true,
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
  };
}

export function useFirebaseQuoteRequests(businessId: string, enabled: boolean) {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const auth = getFirebaseAuth();
    void auth
      .authStateReady()
      .then(() => {
        if (!active) return;
        if (!auth.currentUser) {
          setError("Tu sesión no está disponible. Inicia sesión nuevamente.");
          return;
        }
        const quotesQuery = query(
          collection(getFirebaseDb(), "quoteRequests"),
          where("businessId", "==", businessId),
          orderBy("createdAt", "desc"),
        );
        unsubscribe = onSnapshot(
          quotesQuery,
          (snapshot) => {
            setRequests(
              snapshot.docs.map((item) => mapQuote(item.data(), item.id)),
            );
            setError(null);
          },
          () => setError("No fue posible sincronizar las solicitudes."),
        );
      })
      .catch(() =>
        setError("No fue posible restablecer la sesión. Intenta nuevamente."),
      );
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [businessId, enabled]);

  async function updateStatus(requestId: string, status: QuoteRequestStatus) {
    if (!enabled) return;
    const changedAt = new Date().toISOString();
    await updateDoc(doc(getFirebaseDb(), "quoteRequests", requestId), {
      status,
      updatedAt: serverTimestamp(),
      history: arrayUnion({ status, changedAt }),
    });
  }

  return { requests, error, updateStatus };
}
