"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  publicLeasingInquirySchema,
  type PublicLeasingInquiryInput,
} from "@/domain";

const inputClass =
  "mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-brand-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15";

export function LeasingInquiryDialog({
  spaceId,
  spaceTitle,
  buttonClassName = "button-primary",
}: {
  spaceId: string;
  spaceTitle: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PublicLeasingInquiryInput>({
    resolver: zodResolver(publicLeasingInquirySchema),
    defaultValues: {
      commercialSpaceId: spaceId,
      fullName: "",
      phone: "",
      whatsapp: "",
      email: "",
      company: "",
      businessType: "",
      intendedUse: "",
      requestedStartDate: "",
      comments: "",
      contactPreference: "whatsapp",
      website: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) =>
      event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function submit(values: PublicLeasingInquiryInput) {
    setServerError("");
    const response = await fetch("/api/leasing-inquiries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setServerError(
        typeof body.error === "string"
          ? body.error
          : "No fue posible enviar la solicitud.",
      );
      return;
    }
    setSubmitted(
      typeof body.reference === "string" ? body.reference : "recibida",
    );
    reset();
  }

  return (
    <>
      <button
        type="button"
        data-testid="open-leasing-inquiry"
        onClick={() => {
          setSubmitted(null);
          setOpen(true);
        }}
        className={buttonClassName}
      >
        Solicitar información <Send className="size-4" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[80] overflow-y-auto bg-brand-navy/65 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-8"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setOpen(false)
          }
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="inquiry-title"
            className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl bg-slate-50 shadow-2xl"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-extrabold tracking-[0.12em] text-brand-green uppercase">
                  Consulta institucional
                </p>
                <h2
                  id="inquiry-title"
                  className="mt-1 text-xl font-black text-brand-navy"
                >
                  Solicitar información
                </h2>
                <p className="mt-1 text-sm text-slate-500">{spaceTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar formulario"
                className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </header>
            {submitted ? (
              <div
                data-testid="leasing-inquiry-success"
                className="px-6 py-14 text-center sm:px-12 sm:py-20"
              >
                <CheckCircle2 className="mx-auto size-16 text-brand-green" />
                <h3 className="mt-5 text-3xl font-black text-brand-navy">
                  Solicitud recibida
                </h3>
                <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
                  Hemos recibido su interés en este espacio. Nuestro equipo
                  administrativo podrá ponerse en contacto con usted para
                  confirmar disponibilidad, condiciones y próximos pasos.
                </p>
                {submitted !== "recibida" && (
                  <p className="mt-4 text-sm font-bold text-brand-blue">
                    Referencia: {submitted}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="button-primary mt-7"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(submit)}
                className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-7"
                noValidate
              >
                <input type="hidden" {...register("commercialSpaceId")} />
                <div className="sr-only" aria-hidden="true">
                  <label>
                    Sitio web
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      {...register("website")}
                    />
                  </label>
                </div>
                <Field
                  label="Nombre completo"
                  required
                  error={errors.fullName?.message}
                >
                  <input
                    autoComplete="name"
                    className={inputClass}
                    {...register("fullName")}
                  />
                </Field>
                <Field label="Teléfono" required error={errors.phone?.message}>
                  <input
                    type="tel"
                    autoComplete="tel"
                    className={inputClass}
                    {...register("phone")}
                  />
                </Field>
                <Field label="WhatsApp">
                  <input
                    type="tel"
                    autoComplete="tel"
                    className={inputClass}
                    {...register("whatsapp")}
                  />
                </Field>
                <Field label="Correo">
                  <input
                    type="email"
                    autoComplete="email"
                    className={inputClass}
                    {...register("email")}
                  />
                </Field>
                <Field label="Empresa / negocio">
                  <input
                    autoComplete="organization"
                    className={inputClass}
                    {...register("company")}
                  />
                </Field>
                <Field
                  label="Tipo de negocio"
                  required
                  error={errors.businessType?.message}
                >
                  <input
                    className={inputClass}
                    placeholder="Ej. distribución de alimentos"
                    {...register("businessType")}
                  />
                </Field>
                <Field label="Fecha aproximada en que lo necesitaría">
                  <input
                    type="date"
                    className={inputClass}
                    {...register("requestedStartDate")}
                  />
                </Field>
                <Field label="Preferencia de contacto" required>
                  <select
                    className={inputClass}
                    {...register("contactPreference")}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="phone">Llamada telefónica</option>
                    <option value="email">Correo</option>
                  </select>
                </Field>
                <Field
                  className="sm:col-span-2"
                  label="Uso que desea darle al espacio"
                  required
                  error={errors.intendedUse?.message}
                >
                  <textarea
                    rows={3}
                    className={`${inputClass} py-3`}
                    {...register("intendedUse")}
                  />
                </Field>
                <Field
                  className="sm:col-span-2"
                  label="Comentarios / necesidades"
                >
                  <textarea
                    rows={3}
                    className={`${inputClass} py-3`}
                    {...register("comments")}
                  />
                </Field>
                {serverError && (
                  <p
                    role="alert"
                    className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700 sm:col-span-2"
                  >
                    {serverError}
                  </p>
                )}
                <p className="text-xs leading-5 text-slate-500 sm:col-span-2">
                  Sus datos serán utilizados únicamente por la administración de
                  Central de Abastos de Sula para dar seguimiento a esta
                  solicitud.
                </p>
                <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="button-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="button-primary disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Enviando
                      </>
                    ) : (
                      <>
                        Enviar solicitud <Send className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  required,
  error,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-sm font-bold text-brand-navy ${className}`}>
      {label}
      {required && <span className="text-rose-600"> *</span>}
      {children}
      {error && (
        <span className="mt-1 block text-xs font-semibold text-rose-600">
          Revisa este campo.
        </span>
      )}
    </label>
  );
}
