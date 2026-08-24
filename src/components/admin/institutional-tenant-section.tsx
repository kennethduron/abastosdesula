"use client";

import {
  BadgeCheck,
  Banknote,
  Building2,
  CalendarClock,
  CircleAlert,
  Clock3,
  Eye,
  ReceiptText,
} from "lucide-react";
import { useMemo } from "react";

import {
  accountStatusLabels,
  accountStatusStyles,
  formatBillingDate,
  formatHnl,
  leaseStatusLabels,
  paymentStatusLabels,
  paymentStatusStyles,
} from "@/components/tenant/tenant-billing-utils";
import type { TenantAccount, TenantPayment } from "@/domain";
import { cn } from "@/lib/utils";

export function InstitutionalTenantSection({
  accounts,
  payments,
  loading = false,
  readOnly,
  error,
}: {
  accounts: TenantAccount[];
  payments: TenantPayment[];
  loading?: boolean;
  readOnly: boolean;
  error?: string | null;
}) {
  const summary = useMemo(
    () => ({
      active: accounts.filter((account) => account.leaseStatus === "active")
        .length,
      current: accounts.filter((account) => account.accountStatus === "current")
        .length,
      pending: accounts.filter((account) => account.accountStatus === "pending")
        .length,
      overdue: accounts.filter((account) => account.accountStatus === "overdue")
        .length,
      collected: payments.reduce(
        (total, payment) => total + payment.paidAmountMinor,
        0,
      ),
    }),
    [accounts, payments],
  );
  const upcoming = [...accounts]
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
    .slice(0, 4);
  const recentPayments = [...payments]
    .filter((payment) => payment.paidAt)
    .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""))
    .slice(0, 5);

  return (
    <section
      id="inquilinos"
      className="mt-6 scroll-mt-24"
      data-testid="admin-tenants"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold text-brand-blue">Gestión de cobros</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-brand-navy">
            Inquilinos y estados de cuenta
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Seguimiento institucional de mensualidades, vencimientos y pagos
            registrados para los comercios de la Central.
          </p>
        </div>
        {readOnly && (
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 ring-1 ring-blue-200">
            <Eye className="size-4" /> Acceso de consulta
          </span>
        )}
      </div>
      {loading && (
        <div
          className="mt-5 h-36 animate-pulse rounded-3xl bg-slate-100"
          aria-label="Cargando estados de cuenta"
        />
      )}

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
        >
          {error}
        </p>
      )}

      <div
        className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-5"
        aria-label="Métricas de pagos"
      >
        <BillingMetric
          icon={Building2}
          label="Inquilinos activos"
          value={String(summary.active)}
          tone="blue"
        />
        <BillingMetric
          icon={BadgeCheck}
          label="Al día"
          value={String(summary.current)}
          tone="green"
        />
        <BillingMetric
          icon={Clock3}
          label="Pendientes"
          value={String(summary.pending)}
          tone="amber"
        />
        <BillingMetric
          icon={CircleAlert}
          label="Vencidos"
          value={String(summary.overdue)}
          tone="rose"
        />
        <BillingMetric
          icon={Banknote}
          label="Recaudación registrada"
          value={formatHnl(summary.collected)}
          tone="navy"
          wide
        />
      </div>

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-lg font-black text-brand-navy">Inquilinos</h3>
            <p className="mt-1 text-sm text-slate-500">
              Estado contractual y financiero referencial por negocio.
            </p>
          </div>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Comercio</th>
                  <th className="px-5 py-3">Responsable</th>
                  <th className="px-5 py-3">Local</th>
                  <th className="px-5 py-3">Próximo pago</th>
                  <th className="px-5 py-3">Mensualidad</th>
                  <th className="px-5 py-3">Saldo</th>
                  <th className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <span className="block font-black text-brand-navy">
                        {account.businessName}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {account.categoryName} ·{" "}
                        {leaseStatusLabels[account.leaseStatus]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {account.responsibleName}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {account.stallLabel ?? "No indicado"}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {formatBillingDate(account.nextDueDate)}
                    </td>
                    <td className="px-5 py-4 font-bold text-brand-navy">
                      {formatHnl(account.monthlyAmountMinor)}
                    </td>
                    <td className="px-5 py-4 font-black text-brand-navy">
                      {formatHnl(account.outstandingBalanceMinor)}
                    </td>
                    <td className="px-5 py-4">
                      <AccountBadge status={account.accountStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-slate-100 lg:hidden">
            {accounts.map((account) => (
              <li key={account.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-black text-brand-navy">
                      {account.businessName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {account.stallLabel ?? "Local no indicado"} ·{" "}
                      {account.categoryName}
                    </p>
                  </div>
                  <AccountBadge status={account.accountStatus} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <MiniDetail
                    label="Próximo pago"
                    value={formatBillingDate(account.nextDueDate)}
                  />
                  <MiniDetail
                    label="Saldo"
                    value={formatHnl(account.outstandingBalanceMinor)}
                  />
                  <MiniDetail
                    label="Responsable"
                    value={account.responsibleName}
                  />
                  <MiniDetail
                    label="Mensualidad"
                    value={formatHnl(account.monthlyAmountMinor)}
                  />
                </dl>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-5 text-brand-blue" />
            <h3 className="text-lg font-black text-brand-navy">
              Próximos vencimientos
            </h3>
          </div>
          <ul className="mt-5 space-y-3">
            {upcoming.map((account) => (
              <li
                key={account.id}
                className="rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-brand-navy">
                      {account.businessName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatBillingDate(account.nextDueDate)}
                    </p>
                  </div>
                  <AccountBadge status={account.accountStatus} />
                </div>
                <p className="mt-3 text-sm font-black text-brand-navy">
                  {formatHnl(account.monthlyAmountMinor)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section
        className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        data-testid="admin-payment-status"
      >
        <div className="flex items-center gap-2 border-b border-slate-200 p-5">
          <ReceiptText className="size-5 text-brand-green-dark" />
          <div>
            <h3 className="text-lg font-black text-brand-navy">
              Pagos recientes
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Movimientos registrados en los estados de cuenta.
            </p>
          </div>
        </div>
        <ul className="divide-y divide-slate-100">
          {recentPayments.map((payment) => {
            const account = accounts.find(
              (item) => item.businessId === payment.businessId,
            );
            return (
              <li
                key={payment.id}
                className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-5"
              >
                <div>
                  <p className="font-black text-brand-navy">
                    {account?.businessName ?? "Comercio"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {payment.period} · {payment.reference ?? "Sin referencia"}
                  </p>
                </div>
                <span className="font-black text-brand-navy">
                  {formatHnl(payment.paidAmountMinor)}
                </span>
                <span
                  className={cn(
                    "w-fit rounded-full px-2.5 py-1 text-xs font-black ring-1",
                    paymentStatusStyles[payment.status],
                  )}
                >
                  {paymentStatusLabels[payment.status]}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </section>
  );
}

function BillingMetric({
  icon: Icon,
  label,
  value,
  tone,
  wide = false,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  tone: "blue" | "green" | "amber" | "rose" | "navy";
  wide?: boolean;
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-800",
    rose: "bg-rose-50 text-rose-700",
    navy: "bg-slate-100 text-brand-navy",
  };
  return (
    <article
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5",
        wide && "col-span-2 xl:col-span-1",
      )}
    >
      <span
        className={cn(
          "grid size-10 place-items-center rounded-xl",
          tones[tone],
        )}
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-xs font-semibold text-slate-500 sm:text-sm">
        {label}
      </p>
      <p className="mt-1 text-xl font-black break-words text-brand-navy sm:text-2xl">
        {value}
      </p>
    </article>
  );
}

function AccountBadge({ status }: { status: TenantAccount["accountStatus"] }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-black ring-1",
        accountStatusStyles[status],
      )}
    >
      {accountStatusLabels[status]}
    </span>
  );
}

function MiniDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 font-bold text-brand-navy">{value}</dd>
    </div>
  );
}
