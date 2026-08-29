"use client";

import { Dialog } from "@base-ui/react/dialog";
import { MessageCircle, NotebookPen, PackageSearch, X } from "lucide-react";
import { useState } from "react";

import {
  customerTypeLabels,
  formatDate,
  formatMoney,
  requestReference,
  requestValue,
  statusLabel,
  whatsappUrl,
} from "@/components/dashboard/crm-utils";
import type { Customer, QuoteRequest } from "@/domain";

export function CustomerDetailDrawer({
  customer,
  requests,
  onClose,
  onAddNote,
  onSelectRequest,
}: {
  customer?: Customer;
  requests: QuoteRequest[];
  onClose: () => void;
  onAddNote: (body: string) => void | Promise<void>;
  onSelectRequest: (requestId: string) => void;
}) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const whatsapp = customer
    ? whatsappUrl(customer.whatsapp ?? customer.phone, customer.name)
    : null;
  const products = Array.from(
    new Set(
      requests.flatMap((request) =>
        request.items.map((item) => item.productName),
      ),
    ),
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (note.trim().length < 2) return;
    setSaving(true);
    try {
      await onAddNote(note);
      setNote("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root
      open={Boolean(customer)}
      onOpenChange={(open) => !open && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-brand-navy/55 backdrop-blur-[2px]" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex max-h-dvh w-full max-w-2xl flex-col overflow-hidden bg-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-2xl transition-transform data-ending-style:translate-x-full data-starting-style:translate-x-full sm:py-0">
          {customer && (
            <>
              <div className="flex items-start gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold tracking-[0.14em] text-brand-green-dark uppercase">
                    Perfil comercial
                  </p>
                  <Dialog.Title className="mt-1 truncate text-xl font-black text-brand-navy sm:text-2xl">
                    {customer.name}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-slate-500">
                    {customer.company ?? customerTypeLabels[customer.type]}
                  </Dialog.Description>
                </div>
                <Dialog.Close
                  aria-label="Cerrar detalle del cliente"
                  className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-slate-100"
                >
                  <X className="size-5" />
                </Dialog.Close>
              </div>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-[#f7f9fc] p-4 sm:p-7">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                    <Detail label="Teléfono" value={customer.phone} />
                    <Detail
                      label="WhatsApp"
                      value={customer.whatsapp ?? customer.phone}
                    />
                    <Detail
                      label="Tipo"
                      value={customerTypeLabels[customer.type]}
                    />
                    <Detail
                      label="Solicitudes"
                      value={String(requests.length)}
                    />
                    <Detail
                      label="Completadas"
                      value={String(
                        requests.filter((item) => item.status === "completed")
                          .length,
                      )}
                    />
                    <Detail
                      label="Última interacción"
                      value={
                        requests[0]
                          ? formatDate(requests[0].updatedAt)
                          : formatDate(customer.updatedAt)
                      }
                    />
                  </div>
                  {whatsapp && (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="button-whatsapp mt-5 w-full"
                    >
                      <MessageCircle className="size-4" /> Contactar por
                      WhatsApp
                    </a>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <PackageSearch className="size-5 text-brand-blue" />
                    <h2 className="font-black text-brand-navy">
                      Productos consultados
                    </h2>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {products.map((product) => (
                      <span
                        key={product}
                        className="rounded-full bg-brand-green-pale px-3 py-1.5 text-xs font-bold text-brand-green-dark"
                      >
                        {product}
                      </span>
                    ))}
                    {!products.length && (
                      <p className="text-sm text-slate-500">
                        Sin productos registrados.
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="font-black text-brand-navy">
                    Historial de solicitudes
                  </h2>
                  <ul className="mt-4 divide-y divide-slate-100">
                    {requests.map((request) => (
                      <li key={request.id}>
                        <button
                          type="button"
                          onClick={() => onSelectRequest(request.id)}
                          className="flex min-h-16 w-full items-center gap-3 py-3 text-left hover:bg-slate-50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-extrabold text-brand-green-dark">
                              {requestReference(request)}
                            </p>
                            <p className="mt-1 text-sm font-bold text-brand-navy">
                              {statusLabel(request.status)} ·{" "}
                              {formatDate(request.createdAt)}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-black text-brand-navy">
                            {formatMoney(requestValue(request))}
                          </p>
                        </button>
                      </li>
                    ))}
                    {!requests.length && (
                      <li className="py-8 text-center text-sm text-slate-500">
                        Sin solicitudes todavía.
                      </li>
                    )}
                  </ul>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <NotebookPen className="size-5 text-brand-green-dark" />
                    <h2 className="font-black text-brand-navy">
                      Notas internas
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Privadas para este comercio.
                  </p>
                  <ul className="mt-4 space-y-3">
                    {(customer.internalNotes ?? []).map((item) => (
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
                  <form onSubmit={submit} className="mt-4">
                    <label className="sr-only" htmlFor="customer-internal-note">
                      Nueva nota interna del cliente
                    </label>
                    <textarea
                      id="customer-internal-note"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={3}
                      placeholder="Información útil para próximas conversaciones."
                      className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={saving || note.trim().length < 2}
                      className="button-primary mt-3 w-full disabled:opacity-50"
                    >
                      Agregar nota
                    </button>
                  </form>
                </section>
              </div>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 font-bold break-words text-brand-navy">{value}</dd>
    </div>
  );
}
