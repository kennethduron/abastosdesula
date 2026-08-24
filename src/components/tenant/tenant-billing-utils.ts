import type {
  TenantAccountStatus,
  TenantLeaseStatus,
  TenantPaymentStatus,
} from "@/domain";

export const accountStatusLabels: Record<TenantAccountStatus, string> = {
  current: "Al día",
  pending: "Pendiente",
  overdue: "Vencido",
};

export const paymentStatusLabels: Record<TenantPaymentStatus, string> = {
  paid: "Pagado",
  pending: "Pendiente",
  overdue: "Vencido",
  partial: "Pago parcial",
};

export const leaseStatusLabels: Record<TenantLeaseStatus, string> = {
  active: "Activo",
  pending: "Pendiente",
  inactive: "Inactivo",
};

export const accountStatusStyles: Record<TenantAccountStatus, string> = {
  current: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  overdue: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const paymentStatusStyles: Record<TenantPaymentStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  overdue: "bg-rose-50 text-rose-700 ring-rose-200",
  partial: "bg-blue-50 text-blue-700 ring-blue-200",
};

export function formatHnl(amountMinor: number) {
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function formatBillingDate(value: string, withTime = false) {
  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  }).format(new Date(value));
}
