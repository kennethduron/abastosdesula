"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  MessageCircle,
  NotebookPen,
  PackageCheck,
  Save,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import {
  customerTypeLabels,
  estimatedRequestValue,
  formatDate,
  formatMoney,
  fulfillmentLabels,
  requestReference,
  sourceLabels,
  statusLabel,
  statusOptions,
  whatsappUrl,
} from "@/components/dashboard/crm-utils";
import type { QuoteRequest, QuoteRequestStatus } from "@/domain";
import { cn } from "@/lib/utils";

type DetailTab = "detail" | "quotation" | "activity";

interface RequestDetailDrawerProps {
  request?: QuoteRequest;
  onClose: () => void;
  onStatusChange: (status: QuoteRequestStatus) => void | Promise<void>;
  onAddNote: (body: string) => void | Promise<void>;
  onAddFollowUp: (input: {
    title: string;
    dueAt: string;
    note?: string;
  }) => void | Promise<void>;
  onToggleFollowUp: (followUpId: string) => void | Promise<void>;
  onSaveQuotation: (input: {
    lines: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unit: string;
      unitPriceMinor: number;
    }>;
    discountMinor: number;
    note?: string;
  }) => void | Promise<void>;
}

export function RequestDetailDrawer({
  request,
  onClose,
  onStatusChange,
  onAddNote,
  onAddFollowUp,
  onToggleFollowUp,
  onSaveQuotation,
}: RequestDetailDrawerProps) {
  const [tab, setTab] = useState<DetailTab>("detail");

  return (
    <Dialog.Root
      open={Boolean(request)}
      onOpenChange={(open) => !open && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-brand-navy/55 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex max-h-dvh w-full max-w-3xl flex-col overflow-hidden bg-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-2xl transition-transform duration-200 data-ending-style:translate-x-full data-starting-style:translate-x-full sm:py-0">
          {request && (
            <>
              <div className="shrink-0 border-b border-slate-200 bg-white px-4 pt-4 sm:px-7 sm:pt-6">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold tracking-[0.14em] text-brand-green-dark uppercase">
                      {requestReference(request)}
                    </p>
                    <Dialog.Title className="sr-only">
                      Detalle de solicitud
                    </Dialog.Title>
                    <p className="mt-1 truncate text-xl font-black text-brand-navy sm:text-2xl">
                      {request.customerName}
                    </p>
                    <Dialog.Description className="mt-1 text-sm text-slate-500">
                      {request.company ??
                        customerTypeLabels[request.customerType]}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close
                    aria-label="Cerrar detalle"
                    className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-blue"
                  >
                    <X className="size-5" />
                  </Dialog.Close>
                </div>
                <div className="mt-5 flex gap-1 overflow-x-auto" role="tablist">
                  {[
                    ["detail", "Solicitud"],
                    ["quotation", "Cotización"],
                    ["activity", "Actividad"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={tab === value}
                      onClick={() => setTab(value as DetailTab)}
                      className={cn(
                        "min-h-11 shrink-0 border-b-2 px-4 text-sm font-bold",
                        tab === value
                          ? "border-brand-green text-brand-navy"
                          : "border-transparent text-slate-500 hover:text-brand-navy",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f7f9fc] p-4 sm:p-7">
                {tab === "detail" && (
                  <RequestSummary
                    request={request}
                    onStatusChange={onStatusChange}
                    onAddNote={onAddNote}
                    onAddFollowUp={onAddFollowUp}
                    onToggleFollowUp={onToggleFollowUp}
                  />
                )}
                {tab === "quotation" && (
                  <QuotationEditor request={request} onSave={onSaveQuotation} />
                )}
                {tab === "activity" && <ActivityTimeline request={request} />}
              </div>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function RequestSummary({
  request,
  onStatusChange,
  onAddNote,
  onAddFollowUp,
  onToggleFollowUp,
}: Pick<
  RequestDetailDrawerProps,
  | "request"
  | "onStatusChange"
  | "onAddNote"
  | "onAddFollowUp"
  | "onToggleFollowUp"
> & { request: QuoteRequest }) {
  const [note, setNote] = useState("");
  const [followTitle, setFollowTitle] = useState("");
  const [followDate, setFollowDate] = useState("");
  const [followTime, setFollowTime] = useState("");
  const [followNote, setFollowNote] = useState("");
  const [saving, setSaving] = useState(false);
  const whatsapp = whatsappUrl(
    request.whatsapp ?? request.phone,
    request.customerName,
    requestReference(request),
  );
  const estimated = estimatedRequestValue(request);

  async function submitNote(event: React.FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      await onAddNote(note);
      setNote("");
    } finally {
      setSaving(false);
    }
  }

  async function submitFollowUp(event: React.FormEvent) {
    event.preventDefault();
    if (!followTitle.trim() || !followDate) return;
    setSaving(true);
    try {
      await onAddFollowUp({
        title: followTitle,
        dueAt: new Date(
          `${followDate}T${followTime || "09:00"}:00`,
        ).toISOString(),
        note: followNote || undefined,
      });
      setFollowTitle("");
      setFollowDate("");
      setFollowTime("");
      setFollowNote("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block text-sm font-bold text-brand-navy">
            Estado de la solicitud
            <select
              value={request.status}
              onChange={(event) =>
                void onStatusChange(event.target.value as QuoteRequestStatus)
              }
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="button-whatsapp min-h-12 px-4"
            >
              <MessageCircle className="size-4" />
              Contactar por WhatsApp
            </a>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="font-black text-brand-navy">Información comercial</h3>
        <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
          <Detail label="Cliente" value={request.customerName} />
          <Detail label="Empresa" value={request.company ?? "No indicada"} />
          <Detail
            label="Tipo"
            value={customerTypeLabels[request.customerType]}
          />
          <Detail label="Teléfono" value={request.phone} />
          <Detail label="WhatsApp" value={request.whatsapp ?? request.phone} />
          <Detail
            label="Origen"
            value={sourceLabels[request.source ?? "platform"]}
          />
          <Detail
            label="Modalidad"
            value={fulfillmentLabels[request.fulfillment]}
          />
          <Detail
            label="Recibida"
            value={formatDate(request.createdAt, true)}
          />
          <Detail
            label="Actualizada"
            value={formatDate(request.updatedAt, true)}
          />
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="font-black text-brand-navy">
              Productos solicitados
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {request.items.length}{" "}
              {request.items.length === 1 ? "producto" : "productos"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Valor de referencia</p>
            <p className="font-black text-brand-navy">
              {formatMoney(estimated)}
            </p>
          </div>
        </div>
        <ul className="mt-4 divide-y divide-slate-100">
          {request.items.map((item) => {
            const subtotal = (item.referencePriceMinor ?? 0) * item.quantity;
            return (
              <li
                key={item.productId}
                className="flex gap-3 py-4 first:pt-0 last:pb-0"
              >
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.imageAlt ?? item.productName}
                    width={64}
                    height={64}
                    className="size-14 shrink-0 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-brand-navy">
                    {item.productName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.quantity} {item.unit} ·{" "}
                    {formatMoney(item.referencePriceMinor ?? 0)} por {item.unit}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-brand-navy">
                  {formatMoney(subtotal)}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {request.notes && (
        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
          <div className="flex gap-3">
            <FileText className="mt-0.5 size-5 shrink-0 text-brand-blue" />
            <div>
              <h3 className="font-black text-brand-navy">Notas del cliente</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {request.notes}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2">
          <NotebookPen className="size-5 text-brand-green-dark" />
          <h3 className="font-black text-brand-navy">Notas internas</h3>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Solo son visibles para este comercio.
        </p>
        <ul className="mt-4 space-y-3">
          {(request.internalNotes ?? []).map((item) => (
            <li
              key={item.id}
              className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700"
            >
              <p>{item.body}</p>
              <p className="mt-2 text-xs text-slate-400">
                {formatDate(item.createdAt, true)}
              </p>
            </li>
          ))}
        </ul>
        <form
          onSubmit={submitNote}
          className="mt-4 flex flex-col gap-2 sm:flex-row"
        >
          <label className="sr-only" htmlFor="request-internal-note">
            Nueva nota interna
          </label>
          <textarea
            id="request-internal-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Ej. Solicitó precio especial por volumen."
            className="min-h-12 flex-1 resize-none rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15"
          />
          <button
            type="submit"
            disabled={saving || note.trim().length < 2}
            className="button-primary min-h-12 px-4 disabled:opacity-50"
          >
            Agregar nota
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-5 text-brand-blue" />
          <h3 className="font-black text-brand-navy">Seguimientos</h3>
        </div>
        <ul className="mt-4 space-y-3">
          {(request.followUps ?? []).map((item) => (
            <li
              key={item.id}
              className="flex gap-3 rounded-xl border border-slate-200 p-3"
            >
              <button
                type="button"
                aria-label={
                  item.status === "completed"
                    ? "Reabrir seguimiento"
                    : "Completar seguimiento"
                }
                onClick={() => void onToggleFollowUp(item.id)}
                className={cn(
                  "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border",
                  item.status === "completed"
                    ? "border-brand-green bg-brand-green text-white"
                    : "border-slate-300 text-transparent hover:border-brand-green",
                )}
              >
                <Check className="size-4" />
              </button>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm font-bold text-brand-navy",
                    item.status === "completed" && "line-through opacity-60",
                  )}
                >
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(item.dueAt, true)}
                </p>
                {item.note && (
                  <p className="mt-2 text-sm text-slate-600">{item.note}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
        <form
          onSubmit={submitFollowUp}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <label className="text-xs font-bold text-slate-600 sm:col-span-2">
            Título
            <input
              value={followTitle}
              onChange={(event) => setFollowTitle(event.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15"
              placeholder="Llamar para confirmar pedido"
            />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Fecha
            <input
              type="date"
              value={followDate}
              onChange={(event) => setFollowDate(event.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Hora (opcional)
            <input
              type="time"
              value={followTime}
              onChange={(event) => setFollowTime(event.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
          </label>
          <label className="text-xs font-bold text-slate-600 sm:col-span-2">
            Nota (opcional)
            <textarea
              value={followNote}
              onChange={(event) => setFollowNote(event.target.value)}
              rows={2}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-300 p-3 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={saving || !followDate || followTitle.trim().length < 2}
            className="button-secondary disabled:opacity-50 sm:col-span-2"
          >
            <CalendarClock className="size-4" /> Programar seguimiento
          </button>
        </form>
      </section>
    </div>
  );
}

function QuotationEditor({
  request,
  onSave,
}: {
  request: QuoteRequest;
  onSave: RequestDetailDrawerProps["onSaveQuotation"];
}) {
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      request.items.map((item) => {
        const quoted = request.quotation?.lines.find(
          (line) => line.productId === item.productId,
        );
        return [
          item.productId,
          (
            (quoted?.unitPriceMinor ?? item.referencePriceMinor ?? 0) / 100
          ).toFixed(2),
        ];
      }),
    ),
  );
  const [discount, setDiscount] = useState(() =>
    ((request.quotation?.discountMinor ?? 0) / 100).toFixed(2),
  );
  const [note, setNote] = useState(request.quotation?.note ?? "");
  const [saving, setSaving] = useState(false);
  const lines = useMemo(
    () =>
      request.items.map((item) => ({
        ...item,
        unitPriceMinor: Math.max(
          0,
          Math.round(Number(prices[item.productId] || 0) * 100),
        ),
      })),
    [prices, request.items],
  );
  const subtotal = lines.reduce(
    (total, line) => total + line.unitPriceMinor * line.quantity,
    0,
  );
  const discountMinor = Math.max(0, Math.round(Number(discount || 0) * 100));
  const total = Math.max(0, subtotal - discountMinor);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave({
        lines: lines.map((line) => ({
          productId: line.productId,
          productName: line.productName,
          quantity: line.quantity,
          unit: line.unit,
          unitPriceMinor: line.unitPriceMinor,
        })),
        discountMinor,
        note: note || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2">
          <PackageCheck className="size-5 text-brand-green-dark" />
          <div>
            <h3 className="font-black text-brand-navy">Cotización comercial</h3>
            <p className="text-xs text-slate-500">
              Ajusta cantidades y precios. No genera factura fiscal.
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          {lines.map((line) => (
            <div
              key={line.productId}
              className="rounded-xl border border-slate-200 p-3 sm:grid sm:grid-cols-[1fr_8rem_8rem] sm:items-end sm:gap-3"
            >
              <div>
                <p className="font-bold text-brand-navy">{line.productName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {line.quantity} {line.unit}
                </p>
              </div>
              <label className="mt-3 block text-xs font-bold text-slate-600 sm:mt-0">
                Precio por {line.unit}
                <input
                  aria-label={`Precio de ${line.productName}`}
                  inputMode="decimal"
                  value={prices[line.productId]}
                  onChange={(event) =>
                    setPrices((current) => ({
                      ...current,
                      [line.productId]: event.target.value,
                    }))
                  }
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
              </label>
              <div className="mt-3 text-right sm:mt-0">
                <p className="text-xs text-slate-500">Subtotal</p>
                <p className="mt-1 font-black text-brand-navy">
                  {formatMoney(line.unitPriceMinor * line.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <label className="block text-sm font-bold text-brand-navy">
          Descuento opcional
          <input
            aria-label="Descuento de la cotización"
            inputMode="decimal"
            value={discount}
            onChange={(event) => setDiscount(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 sm:max-w-48"
          />
        </label>
        <label className="mt-4 block text-sm font-bold text-brand-navy">
          Observación
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className="mt-2 w-full resize-none rounded-xl border border-slate-300 p-3 text-sm"
            placeholder="Condiciones, disponibilidad o vigencia."
          />
        </label>
        <dl className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Subtotal</dt>
            <dd className="font-bold text-brand-navy">
              {formatMoney(subtotal)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Descuento</dt>
            <dd className="font-bold text-brand-navy">
              − {formatMoney(discountMinor)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-3 text-lg">
            <dt className="font-black text-brand-navy">Total</dt>
            <dd className="font-black text-brand-green-dark">
              {formatMoney(total)}
            </dd>
          </div>
        </dl>
        <button
          type="submit"
          disabled={saving}
          className="button-primary mt-5 w-full disabled:opacity-50"
        >
          <Save className="size-4" />{" "}
          {saving ? "Guardando…" : "Guardar cotización"}
        </button>
        {request.quotation && (
          <p className="mt-3 text-center text-xs text-slate-500">
            Versión {request.quotation.version} · actualizada{" "}
            {formatDate(request.quotation.updatedAt, true)}
          </p>
        )}
      </section>
    </form>
  );
}

function ActivityTimeline({ request }: { request: QuoteRequest }) {
  const entries = [
    ...(request.activity ?? []),
    ...request.history.map((item, index) => ({
      id: `status-${index}-${item.changedAt}`,
      type: "status_changed" as const,
      description: `Estado: ${statusLabel(item.status)}`,
      createdAt: item.changedAt,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Clock3 className="size-5 text-brand-blue" />
        <h3 className="font-black text-brand-navy">Historial de actividad</h3>
      </div>
      <ol className="mt-6 space-y-5">
        {entries.map((entry, index) => (
          <li key={entry.id} className="relative flex gap-4">
            {index < entries.length - 1 && (
              <span className="absolute top-7 bottom-[-1.25rem] left-[0.45rem] w-px bg-slate-200" />
            )}
            <span className="mt-1.5 size-4 shrink-0 rounded-full border-4 border-brand-green-pale bg-brand-green" />
            <div>
              <p className="text-sm font-bold text-brand-navy">
                {entry.description}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDate(entry.createdAt, true)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {!entries.length && (
        <div className="py-10 text-center">
          <CheckCircle2 className="mx-auto size-9 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            Aún no hay actividad registrada.
          </p>
        </div>
      )}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-bold break-words text-brand-navy">
        {value}
      </dd>
    </div>
  );
}
