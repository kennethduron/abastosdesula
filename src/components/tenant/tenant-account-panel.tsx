"use client";

import {
  BadgeCheck,
  Banknote,
  CalendarDays,
  Clock3,
  CreditCard,
  FileClock,
  ReceiptText,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  accountStatusLabels,
  accountStatusStyles,
  formatBillingDate,
  formatHnl,
  paymentStatusLabels,
  paymentStatusStyles,
} from "@/components/tenant/tenant-billing-utils";
import type { TenantAccount, TenantPayment } from "@/domain";
import { cn } from "@/lib/utils";

export function TenantAccountPanel({
  account,
  payments,
  loading = false,
  error,
}: {
  account?: TenantAccount;
  payments: TenantPayment[];
  loading?: boolean;
  error?: string | null;
}) {
  const [view, setView] = useState<"summary" | "history">("summary");
  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
    [payments],
  );
  const lastPayment = sortedPayments
    .filter((payment) => payment.status === "paid" && payment.paidAt)
    .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""))[0];

  if (loading) {
    return (
      <section
        className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
        aria-busy="true"
      >
        <div className="h-5 w-32 animate-pulse rounded-full bg-slate-100" />
        <div className="mt-4 h-9 max-w-md animate-pulse rounded-xl bg-slate-100" />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!account) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <FileClock className="mx-auto size-10 text-slate-400" />
        <h1 className="mt-4 text-2xl font-black text-brand-navy">
          Estado de cuenta en preparación
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          La información de mensualidades y pagos aparecerá aquí cuando sea
          habilitada por la administración.
        </p>
      </section>
    );
  }

  const notice =
    account.accountStatus === "overdue"
      ? `Existe un saldo vencido de ${formatHnl(account.outstandingBalanceMinor)}. Consulte con administración para regularizarlo.`
      : account.accountStatus === "pending"
        ? `Su próximo pago vence el ${formatBillingDate(account.nextDueDate)}.`
        : `Su cuenta está al día. El próximo vencimiento es el ${formatBillingDate(account.nextDueDate)}.`;

  return (
    <div className="min-w-0" data-testid="tenant-account">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold text-brand-green-dark">
            Autogestión del local
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-brand-navy sm:text-3xl">
            Estado de cuenta
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Consulte mensualidades, vencimientos e historial registrado para{" "}
            {account.businessName}.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-black ring-1",
            accountStatusStyles[account.accountStatus],
          )}
        >
          {account.accountStatus === "current" ? (
            <BadgeCheck className="size-4" />
          ) : (
            <TriangleAlert className="size-4" />
          )}
          {accountStatusLabels[account.accountStatus]}
        </span>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
        >
          {error}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          icon={Banknote}
          label="Mensualidad actual"
          value={formatHnl(account.monthlyAmountMinor)}
          detail="Valor mensual referencial"
        />
        <SummaryCard
          icon={CalendarDays}
          label="Próximo vencimiento"
          value={formatBillingDate(account.nextDueDate)}
          detail={account.stallLabel ?? "Local asignado"}
        />
        <SummaryCard
          icon={ReceiptText}
          label="Saldo pendiente"
          value={formatHnl(account.outstandingBalanceMinor)}
          detail={accountStatusLabels[account.accountStatus]}
        />
        <SummaryCard
          icon={Clock3}
          label="Último pago"
          value={
            lastPayment?.paidAt
              ? formatBillingDate(lastPayment.paidAt)
              : "Sin registro"
          }
          detail={
            lastPayment
              ? formatHnl(lastPayment.paidAmountMinor)
              : "Aún no disponible"
          }
        />
      </div>

      <section
        className={cn(
          "mt-5 rounded-2xl border p-4 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5",
          account.accountStatus === "overdue"
            ? "border-rose-200 bg-rose-50"
            : "border-emerald-200 bg-emerald-50",
        )}
      >
        <div className="flex gap-3">
          <ShieldCheck
            className={cn(
              "mt-0.5 size-5 shrink-0",
              account.accountStatus === "overdue"
                ? "text-rose-700"
                : "text-emerald-700",
            )}
          />
          <div>
            <h2 className="font-black text-brand-navy">Aviso de pago</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{notice}</p>
          </div>
        </div>
        <div className="mt-4 shrink-0 sm:mt-0 sm:text-right">
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-navy px-4 text-sm font-bold text-white opacity-70"
          >
            <CreditCard className="size-4" /> Pago en línea
          </button>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Disponible en una próxima etapa
          </p>
        </div>
      </section>

      <div className="mt-6 flex w-fit gap-1 rounded-xl bg-slate-100 p-1">
        <ViewButton
          active={view === "summary"}
          onClick={() => setView("summary")}
        >
          Resumen
        </ViewButton>
        <ViewButton
          active={view === "history"}
          onClick={() => setView("history")}
        >
          Historial
        </ViewButton>
      </div>

      {view === "summary" ? (
        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-brand-navy">
              Información del local
            </h2>
            <dl className="mt-5 grid grid-cols-2 gap-5 text-sm">
              <Detail label="Nombre comercial" value={account.businessName} />
              <Detail label="Responsable" value={account.responsibleName} />
              <Detail
                label="Local o puesto"
                value={account.stallLabel ?? "No indicado"}
              />
              <Detail label="Categoría" value={account.categoryName} />
            </dl>
          </article>
          <article className="rounded-2xl bg-brand-navy p-5 text-white shadow-sm">
            <FileClock className="size-7 text-brand-green-light" />
            <h2 className="mt-4 text-lg font-black">Próximos pasos</h2>
            <p className="mt-2 text-sm leading-6 text-blue-100">
              Este espacio está preparado para incorporar recordatorios,
              comprobantes y confirmaciones cuando la administración habilite
              esas modalidades.
            </p>
          </article>
        </section>
      ) : (
        <PaymentHistory payments={sortedPayments} />
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <span className="grid size-10 place-items-center rounded-xl bg-brand-green-pale text-brand-green-dark">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-xs font-semibold text-slate-500 sm:text-sm">
        {label}
      </p>
      <p className="mt-1 text-lg font-black break-words text-brand-navy sm:text-xl">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

function ViewButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-10 rounded-lg px-4 text-sm font-bold",
        active ? "bg-white text-brand-navy shadow-sm" : "text-slate-500",
      )}
    >
      {children}
    </button>
  );
}

function PaymentHistory({ payments }: { payments: TenantPayment[] }) {
  return (
    <section
      className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      data-testid="tenant-payments"
    >
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-lg font-black text-brand-navy">
          Historial de pagos
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Períodos y comprobantes registrados por la administración.
        </p>
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-5 py-3">Período</th>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Concepto</th>
              <th className="px-5 py-3">Monto</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3">Referencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-5 py-4 font-bold text-brand-navy">
                  {payment.period}
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {formatBillingDate(payment.paidAt ?? payment.dueDate)}
                </td>
                <td className="px-5 py-4 text-slate-600">{payment.concept}</td>
                <td className="px-5 py-4 font-black text-brand-navy">
                  {formatHnl(payment.amountMinor)}
                </td>
                <td className="px-5 py-4">
                  <PaymentBadge status={payment.status} />
                </td>
                <td className="px-5 py-4 text-slate-500">
                  {payment.reference ?? "Pendiente"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-slate-100 md:hidden">
        {payments.map((payment) => (
          <li key={payment.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-brand-navy">{payment.period}</p>
                <p className="mt-1 text-xs text-slate-500">{payment.concept}</p>
              </div>
              <PaymentBadge status={payment.status} />
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Fecha</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {formatBillingDate(payment.paidAt ?? payment.dueDate)}
                </p>
              </div>
              <p className="font-black text-brand-navy">
                {formatHnl(payment.amountMinor)}
              </p>
            </div>
            {payment.reference && (
              <p className="mt-3 text-xs font-semibold text-brand-green-dark">
                Comprobante {payment.reference}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function PaymentBadge({ status }: { status: TenantPayment["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1",
        paymentStatusStyles[status],
      )}
    >
      {paymentStatusLabels[status]}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 font-bold text-brand-navy">{value}</dd>
    </div>
  );
}
