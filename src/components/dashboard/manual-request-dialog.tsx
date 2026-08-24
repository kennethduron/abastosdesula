"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";

import { statusOptions } from "@/components/dashboard/crm-utils";
import {
  manualQuoteRequestSchema,
  type Customer,
  type ManualQuoteRequestInput,
} from "@/domain";

export interface DashboardProduct {
  id: string;
  businessId: string;
  name: string;
  unit: string;
  image: string;
  imageAlt: string;
  referencePriceMinor: number;
}

export function ManualRequestDialog({
  open,
  onOpenChange,
  businessId,
  customers,
  products,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  customers: Customer[];
  products: DashboardProduct[];
  onSave: (input: ManualQuoteRequestInput) => void | Promise<void>;
}) {
  const [customerMode, setCustomerMode] = useState<"existing" | "new">(
    customers.length ? "existing" : "new",
  );
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [name, setName] = useState(customers[0]?.name ?? "");
  const [company, setCompany] = useState(customers[0]?.company ?? "");
  const [customerType, setCustomerType] = useState<
    ManualQuoteRequestInput["customerType"]
  >(customers[0]?.type ?? "person");
  const [phone, setPhone] = useState(customers[0]?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(customers[0]?.whatsapp ?? "");
  const [source, setSource] =
    useState<ManualQuoteRequestInput["source"]>("phone");
  const [fulfillment, setFulfillment] =
    useState<ManualQuoteRequestInput["fulfillment"]>("coordinate");
  const [status, setStatus] =
    useState<ManualQuoteRequestInput["status"]>("new");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<
    Array<{ productId: string; quantity: string; price: string }>
  >(() => [
    {
      productId: products[0]?.id ?? "",
      quantity: "1",
      price: ((products[0]?.referencePriceMinor ?? 0) / 100).toFixed(2),
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function selectCustomer(nextId: string) {
    setCustomerId(nextId);
    const customer = customers.find((item) => item.id === nextId);
    if (!customer) return;
    setName(customer.name);
    setCompany(customer.company ?? "");
    setCustomerType(customer.type);
    setPhone(customer.phone);
    setWhatsapp(customer.whatsapp ?? "");
  }

  function updateRow(index: number, patch: Partial<(typeof rows)[number]>) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const input = {
      businessId,
      ...(customerMode === "existing" && customerId ? { customerId } : {}),
      customerName: name,
      ...(company ? { company } : {}),
      customerType,
      phone,
      ...(whatsapp ? { whatsapp } : {}),
      source,
      fulfillment,
      ...(notes ? { notes } : {}),
      status,
      items: rows.map((row) => {
        const product = products.find((item) => item.id === row.productId);
        return {
          productId: row.productId,
          productName: product?.name ?? "",
          quantity: Number(row.quantity),
          unit: product?.unit ?? "unidad",
          referencePriceMinor: Math.max(0, Math.round(Number(row.price) * 100)),
          image: product?.image,
          imageAlt: product?.imageAlt,
        };
      }),
    };
    const parsed = manualQuoteRequestSchema.safeParse(input);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Revisa los datos ingresados.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(parsed.data);
      onOpenChange(false);
    } catch {
      setError("No fue posible guardar la solicitud.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-brand-navy/55 backdrop-blur-[2px]" />
        <Dialog.Popup className="fixed inset-0 z-50 overflow-y-auto bg-[#f7f9fc] sm:inset-6 sm:mx-auto sm:max-w-4xl sm:rounded-3xl sm:border sm:border-slate-200 sm:shadow-2xl">
          <div className="sticky top-0 z-10 flex items-start gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:rounded-t-3xl sm:px-7 sm:py-6">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold tracking-[0.14em] text-brand-green-dark uppercase">
                Registro comercial
              </p>
              <Dialog.Title className="mt-1 text-xl font-black text-brand-navy sm:text-2xl">
                Nueva solicitud
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-500">
                Registra una consulta recibida fuera de la plataforma.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Cerrar nueva solicitud"
              className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-blue"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <form onSubmit={submit} className="space-y-5 p-4 sm:p-7">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="font-black text-brand-navy">Cliente</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setCustomerMode("existing")}
                  className={`min-h-10 rounded-lg text-sm font-bold ${customerMode === "existing" ? "bg-white text-brand-navy shadow-sm" : "text-slate-500"}`}
                >
                  Cliente existente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode("new");
                    setCustomerId("");
                    setName("");
                    setCompany("");
                    setPhone("");
                    setWhatsapp("");
                  }}
                  className={`min-h-10 rounded-lg text-sm font-bold ${customerMode === "new" ? "bg-white text-brand-navy shadow-sm" : "text-slate-500"}`}
                >
                  Nuevo cliente
                </button>
              </div>
              {customerMode === "existing" && customers.length > 0 && (
                <label className="mt-4 block text-sm font-bold text-slate-700">
                  Seleccionar cliente
                  <select
                    value={customerId}
                    onChange={(event) => selectCustomer(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3"
                  >
                    <option value="">Selecciona un cliente</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.company ? ` · ${customer.company}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nombre"
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                  disabled={customerMode === "existing"}
                />
                <Field
                  label="Empresa (opcional)"
                  value={company}
                  onChange={setCompany}
                  autoComplete="organization"
                  disabled={customerMode === "existing"}
                />
                <label className="text-sm font-bold text-slate-700">
                  Tipo de cliente
                  <select
                    value={customerType}
                    onChange={(event) =>
                      setCustomerType(event.target.value as typeof customerType)
                    }
                    disabled={customerMode === "existing"}
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 disabled:bg-slate-50"
                  >
                    <option value="person">Persona</option>
                    <option value="restaurant">Restaurante</option>
                    <option value="supermarket">Supermercado</option>
                    <option value="business">Negocio</option>
                    <option value="other">Otro</option>
                  </select>
                </label>
                <Field
                  label="Teléfono"
                  value={phone}
                  onChange={setPhone}
                  inputMode="tel"
                  disabled={customerMode === "existing"}
                />
                <Field
                  label="WhatsApp (opcional)"
                  value={whatsapp}
                  onChange={setWhatsapp}
                  inputMode="tel"
                  disabled={customerMode === "existing"}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="font-black text-brand-navy">
                Datos de la solicitud
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <label className="text-sm font-bold text-slate-700">
                  Origen
                  <select
                    value={source}
                    onChange={(event) =>
                      setSource(event.target.value as typeof source)
                    }
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="phone">Teléfono</option>
                    <option value="in_person">Presencial</option>
                    <option value="other">Otro</option>
                    <option value="platform">Plataforma</option>
                  </select>
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Modalidad
                  <select
                    value={fulfillment}
                    onChange={(event) =>
                      setFulfillment(event.target.value as typeof fulfillment)
                    }
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3"
                  >
                    <option value="coordinate">Coordinar</option>
                    <option value="pickup">Retiro</option>
                    <option value="delivery">Entrega</option>
                  </select>
                </label>
                <label className="text-sm font-bold text-slate-700">
                  Estado
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as typeof status)
                    }
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-black text-brand-navy">Productos</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Cantidad y precio de referencia.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setRows((current) => [
                      ...current,
                      {
                        productId: products[0]?.id ?? "",
                        quantity: "1",
                        price: (
                          (products[0]?.referencePriceMinor ?? 0) / 100
                        ).toFixed(2),
                      },
                    ])
                  }
                  className="button-secondary min-h-10 px-3"
                >
                  <Plus className="size-4" /> Agregar
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {rows.map((row, index) => (
                  <div
                    key={`${index}-${row.productId}`}
                    className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_7rem_8rem_auto] sm:items-end"
                  >
                    <label className="text-xs font-bold text-slate-600">
                      Producto
                      <select
                        aria-label={`Producto ${index + 1}`}
                        value={row.productId}
                        onChange={(event) => {
                          const product = products.find(
                            (item) => item.id === event.target.value,
                          );
                          updateRow(index, {
                            productId: event.target.value,
                            price: (
                              (product?.referencePriceMinor ?? 0) / 100
                            ).toFixed(2),
                          });
                        }}
                        className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                      >
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} · {product.unit}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Field
                      label="Cantidad"
                      value={row.quantity}
                      onChange={(value) =>
                        updateRow(index, { quantity: value })
                      }
                      inputMode="decimal"
                    />
                    <Field
                      label="Precio (L)"
                      value={row.price}
                      onChange={(value) => updateRow(index, { price: value })}
                      inputMode="decimal"
                    />
                    <button
                      type="button"
                      aria-label={`Quitar producto ${index + 1}`}
                      disabled={rows.length === 1}
                      onClick={() =>
                        setRows((current) =>
                          current.filter((_, rowIndex) => rowIndex !== index),
                        )
                      }
                      className="grid size-11 place-items-center rounded-xl text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <label className="mt-4 block text-sm font-bold text-slate-700">
                Observaciones
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-300 p-3 text-sm"
                />
              </label>
            </section>
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
              >
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-3 pb-[max(0rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
              <Dialog.Close className="button-secondary">Cancelar</Dialog.Close>
              <button
                type="submit"
                disabled={saving}
                className="button-primary disabled:opacity-50"
              >
                <Save className="size-4" />{" "}
                {saving ? "Guardando…" : "Guardar solicitud"}
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  ...inputProps
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "disabled"
>) {
  return (
    <label className="text-xs font-bold text-slate-600">
      {label}
      <input
        {...inputProps}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal text-brand-navy disabled:bg-slate-50"
      />
    </label>
  );
}
