"use client";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { getFirebaseAuth } from "@/data/adapters/firebase/auth-client";
import { getFirebaseDb } from "@/data/adapters/firebase/firestore-client";

export interface InstitutionalActivitySummary {
  id: string;
  businessId: string;
  type: string;
  createdAt: string;
}

function mapActivity(data: DocumentData, id: string) {
  const timestamp = data.createdAt;
  const createdAt =
    timestamp && typeof timestamp.toDate === "function"
      ? timestamp.toDate().toISOString()
      : new Date().toISOString();
  return {
    id,
    businessId: String(data.businessId),
    type: String(data.type),
    createdAt,
  } satisfies InstitutionalActivitySummary;
}

export function useFirebaseInstitutionalActivities(enabled: boolean) {
  const [activities, setActivities] = useState<InstitutionalActivitySummary[]>(
    [],
  );
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
          setError("La sesión de Firebase no está disponible.");
          return;
        }
        unsubscribe = onSnapshot(
          query(
            collection(getFirebaseDb(), "activities"),
            orderBy("createdAt", "desc"),
          ),
          (snapshot) => {
            setActivities(
              snapshot.docs.map((item) => mapActivity(item.data(), item.id)),
            );
            setError(null);
          },
          () =>
            setError("No fue posible sincronizar la actividad institucional."),
        );
      })
      .catch(() => setError("No fue posible restaurar la sesión de Firebase."));
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [enabled]);

  return { activities, error };
}
