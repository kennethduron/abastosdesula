"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useCart } from "@/components/cart/cart-provider";
import { publicQuoteRequestSchema } from "@/domain";
import { saveDemoQuoteRequest } from "@/data/adapters/browser/quote-request-store";
import { isFirebaseClientConfigured } from "@/data/adapters/firebase/config";

const customerDetailsSchema = publicQuoteRequestSchema.pick({
  customerName: true,
  customerType: true,
  phone: true,
  whatsapp: true,
  fulfillment: true,
  notes: true,
});

type CustomerDetails = z.infer<typeof customerDetailsSchema>;

export function QuoteRequestForm({ onClose }: { onClose: () => void }) {
  const { cart, completeCart } = useCart();
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const firebaseAvailable = isFirebaseClientConfigured();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerDetails>({
    resolver: zodResolver(customerDetailsSchema),
    defaultValues: {
      customerType: "person",
      fulfillment: "coordinate",
    },
  });

  async function submit(details: CustomerDetails) {
    if (!cart.businessId || !cart.items.length) return;
    setSubmissionError(null);
    const input = {
      businessId: cart.businessId,
      ...details,
      items: cart.items.map(({ productId, quantity, unit }) => ({
        productId,
        quantity,
        unit,
      })),
    };
    if (firebaseAvailable) {
      try {
        const response = await fetch("/api/quote-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const result = (await response.json()) as {
          id?: string;
          error?: string;
        };
        if (!response.ok || !result.id) {
          setSubmissionError(
            result.error ?? "No fue posible guardar la solicitud.",
          );
          return;
        }
        setConfirmationId(result.id);
        completeCart();
      } catch {
        setSubmissionError(
          "No fue posible registrar la solicitud. Intenta nuevamente.",
        );
      }
      return;
    }
    const request = saveDemoQuoteRequest({
      businessName: cart.items[0].businessName,
      input,
      items: cart.items.map(({ productId, productName, quantity, unit }) => ({
        productId,
        productName,
        quantity,
        unit,
      })),
    });
    setConfirmationId(request.id);
    completeCart();
  }

  if (confirmationId) {
    return (
      <div
        data-testid="quote-confirmation"
        className="rounded-2xl bg-brand-green-pale p-5 text-center"
      >
        <CheckCircle2
          className="mx-auto size-10 text-brand-green"
          aria-hidden="true"
        />
        <h3 className="mt-3 text-lg font-extrabold text-brand-navy">
          Solicitud recibida
        </h3>
        <p className="mt-2 text-xs leading-5 text-slate-600">
          Tu solicitud quedó registrada con estado Nueva. El comerciante podrá
          revisarla desde su panel.
        </p>
        <p className="mt-3 text-[0.65rem] font-bold break-all text-brand-green">
          {confirmationId}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="button-primary mt-4 w-full"
        >
          Cerrar confirmación
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="mt-5 border-t border-slate-200 pt-5"
      noValidate
    >
      <h3 className="text-sm font-extrabold text-brand-navy">Tus datos</h3>
      <div className="mt-3 grid gap-3">
        <label className="block text-xs font-bold text-slate-600">
          Nombre completo
          <input
            {...register("customerName")}
            autoComplete="name"
            className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal text-brand-navy outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/10"
          />
          {errors.customerName && (
            <span className="mt-1 block text-xs text-red-600">
              {errors.customerName.message}
            </span>
          )}
        </label>
        <label className="block text-xs font-bold text-slate-600">
          Tipo de cliente
          <select
            {...register("customerType")}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal text-brand-navy outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/10"
          >
            <option value="person">Persona</option>
            <option value="restaurant">Restaurante</option>
            <option value="supermarket">Supermercado</option>
            <option value="business">Negocio</option>
            <option value="other">Otro</option>
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-bold text-slate-600">
            Teléfono
            <input
              {...register("phone")}
              inputMode="tel"
              autoComplete="tel"
              className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal text-brand-navy outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/10"
            />
            {errors.phone && (
              <span className="mt-1 block text-xs text-red-600">
                {errors.phone.message}
              </span>
            )}
          </label>
          <label className="block text-xs font-bold text-slate-600">
            WhatsApp (opcional)
            <input
              {...register("whatsapp", {
                setValueAs: (value) => value || undefined,
              })}
              inputMode="tel"
              className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal text-brand-navy outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/10"
            />
          </label>
        </div>
        <label className="block text-xs font-bold text-slate-600">
          Modalidad
          <select
            {...register("fulfillment")}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal text-brand-navy outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/10"
          >
            <option value="coordinate">Coordinar con el comerciante</option>
            <option value="pickup">Retiro</option>
            <option value="delivery">Entrega</option>
          </select>
        </label>
        <label className="block text-xs font-bold text-slate-600">
          Observaciones (opcional)
          <textarea
            {...register("notes", {
              setValueAs: (value) => value || undefined,
            })}
            rows={3}
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm font-normal text-brand-navy outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/10"
          />
        </label>
      </div>
      {submissionError && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
        >
          {submissionError}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="button-primary mt-4 w-full"
      >
        <Send className="size-4" aria-hidden="true" />
        Enviar solicitud
      </button>
      <p className="mt-3 text-center text-[0.68rem] leading-5 text-slate-500">
        Al enviar, autorizas el uso de esta información para gestionar tu
        solicitud con el comerciante seleccionado.
      </p>
    </form>
  );
}
