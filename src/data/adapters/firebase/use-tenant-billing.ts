"use client";

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { getFirebaseAuth } from "@/data/adapters/firebase/auth-client";
import { getFirebaseDb } from "@/data/adapters/firebase/firestore-client";
import type { TenantAccount, TenantPayment } from "@/domain";

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

function mapAccount(data: DocumentData, id: string): TenantAccount {
  return {
    id,
    businessId: String(data.businessId),
    businessName: String(data.businessName),
    responsibleName: String(data.responsibleName),
    stallLabel:
      typeof data.stallLabel === "string" ? data.stallLabel : undefined,
    categoryName: String(data.categoryName),
    leaseStatus: data.leaseStatus,
    nextDueDate: toIsoDate(data.nextDueDate),
    monthlyAmountMinor: Number(data.monthlyAmountMinor ?? 0),
    outstandingBalanceMinor: Number(data.outstandingBalanceMinor ?? 0),
    accountStatus: data.accountStatus,
    isDemo: true,
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
  };
}

function mapPayment(data: DocumentData, id: string): TenantPayment {
  return {
    id,
    businessId: String(data.businessId),
    period: String(data.period),
    dueDate: toIsoDate(data.dueDate),
    concept: String(data.concept),
    amountMinor: Number(data.amountMinor ?? 0),
    paidAmountMinor: Number(data.paidAmountMinor ?? 0),
    status: data.status,
    paidAt: data.paidAt ? toIsoDate(data.paidAt) : undefined,
    reference: typeof data.reference === "string" ? data.reference : undefined,
    isDemo: true,
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
  };
}

export function useFirebaseTenantBilling({
  enabled,
  businessId,
  institutional = false,
}: {
  enabled: boolean;
  businessId?: string;
  institutional?: boolean;
}) {
  const [accounts, setAccounts] = useState<TenantAccount[]>([]);
  const [payments, setPayments] = useState<TenantPayment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accountReady, setAccountReady] = useState(false);
  const [paymentsReady, setPaymentsReady] = useState(false);

  useEffect(() => {
    if (!enabled || (!institutional && !businessId)) return;
    let active = true;
    const unsubscribers: Array<() => void> = [];
    void getFirebaseAuth()
      .authStateReady()
      .then(() => {
        if (!active || !getFirebaseAuth().currentUser) {
          setAccountReady(true);
          setPaymentsReady(true);
          setError("Tu sesión no está disponible. Inicia sesión nuevamente.");
          return;
        }
        const db = getFirebaseDb();
        const paymentSource = institutional
          ? query(collection(db, "tenantPayments"), orderBy("dueDate", "desc"))
          : query(
              collection(db, "tenantPayments"),
              where("businessId", "==", businessId),
              orderBy("dueDate", "desc"),
            );
        const unsubscribeAccount = institutional
          ? onSnapshot(
              query(collection(db, "tenantAccounts"), orderBy("businessName")),
              (snapshot) => {
                setAccounts(
                  snapshot.docs.map((item) => mapAccount(item.data(), item.id)),
                );
                setAccountReady(true);
                setError(null);
              },
              () => {
                setAccountReady(true);
                setError("No fue posible consultar los estados de cuenta.");
              },
            )
          : onSnapshot(
              doc(db, "tenantAccounts", businessId as string),
              (snapshot) => {
                setAccounts(
                  snapshot.exists()
                    ? [mapAccount(snapshot.data(), snapshot.id)]
                    : [],
                );
                setAccountReady(true);
                setError(null);
              },
              () => {
                setAccountReady(true);
                setError("No fue posible consultar el estado de cuenta.");
              },
            );
        unsubscribers.push(
          unsubscribeAccount,
          onSnapshot(
            paymentSource,
            (snapshot) => {
              setPayments(
                snapshot.docs.map((item) => mapPayment(item.data(), item.id)),
              );
              setPaymentsReady(true);
              setError(null);
            },
            () => {
              setPaymentsReady(true);
              setError("No fue posible consultar el historial de pagos.");
            },
          ),
        );
      })
      .catch(() => {
        setAccountReady(true);
        setPaymentsReady(true);
        setError("No fue posible restablecer la sesión.");
      });
    return () => {
      active = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [businessId, enabled, institutional]);

  return {
    accounts,
    payments,
    error,
    loading: enabled && (!accountReady || !paymentsReady),
  };
}
