"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { cloneElement, type ReactElement } from "react";
import { useForm } from "react-hook-form";

import {
  merchantApplicationSchema,
  type MerchantApplicationInput,
} from "@/domain";

const categories = [
  ["category-fruits", "Frutas"],
  ["category-vegetables", "Verduras"],
  ["category-grains", "Granos"],
  ["category-dairy", "Lácteos"],
  ["category-groceries", "Abarrotes"],
] as const;

export function MerchantRegistrationForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MerchantApplicationInput>({
    resolver: zodResolver(merchantApplicationSchema),
    defaultValues: {
      responsibleName: "",
      email: "",
      phone: "",
      whatsapp: "",
      businessName: "",
      categoryId: "category-fruits",
      stall: "",
      password: "",
      confirmPassword: "",
      acceptedTerms: false,
    },
  });

  return (
    <form
      className="mt-8 space-y-6"
      onSubmit={handleSubmit(async (values) => {
        const response = await fetch("/api/merchant-applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError("root", {
            message: result.error ?? "No fue posible enviar la solicitud.",
          });
          return;
        }
        router.replace("/solicitud-recibida");
      })}
    >
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="sr-only">Información del responsable</legend>
        <Field
          id="registration-responsible-name"
          label="Nombre del responsable"
          error={errors.responsibleName?.message}
        >
          <input {...register("responsibleName")} autoComplete="name" />
        </Field>
        <Field
          id="registration-email"
          label="Correo electrónico"
          error={errors.email?.message}
        >
          <input {...register("email")} type="email" autoComplete="email" />
        </Field>
        <Field
          id="registration-phone"
          label="Teléfono"
          error={errors.phone?.message}
        >
          <input
            {...register("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
          />
        </Field>
        <Field
          id="registration-whatsapp"
          label="WhatsApp"
          error={errors.whatsapp?.message}
        >
          <input
            {...register("whatsapp")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
          />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2">
        <legend className="sr-only">Información comercial</legend>
        <Field
          id="registration-business-name"
          label="Nombre comercial"
          error={errors.businessName?.message}
        >
          <input {...register("businessName")} autoComplete="organization" />
        </Field>
        <Field
          id="registration-category"
          label="Categoría"
          error={errors.categoryId?.message}
        >
          <select {...register("categoryId")}>
            {categories.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="registration-stall"
          label="Local o puesto (opcional)"
          error={errors.stall?.message}
        >
          <input {...register("stall")} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2">
        <legend className="sr-only">Credenciales de acceso</legend>
        <Field
          id="registration-password"
          label="Contraseña"
          error={errors.password?.message}
        >
          <input
            {...register("password")}
            type="password"
            autoComplete="new-password"
          />
        </Field>
        <Field
          id="registration-confirm-password"
          label="Confirmar contraseña"
          error={errors.confirmPassword?.message}
        >
          <input
            {...register("confirmPassword")}
            type="password"
            autoComplete="new-password"
          />
        </Field>
      </fieldset>

      <label className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        <input
          {...register("acceptedTerms")}
          id="registration-terms"
          type="checkbox"
          aria-invalid={errors.acceptedTerms ? true : undefined}
          aria-describedby={
            errors.acceptedTerms ? "registration-terms-error" : undefined
          }
          className="mt-1 size-4 accent-brand-green"
        />
        <span>
          Confirmo que la información es correcta y acepto que la Central la
          revise antes de habilitar el acceso comercial.
          {errors.acceptedTerms?.message && (
            <span
              id="registration-terms-error"
              className="mt-1 block font-semibold text-rose-700"
            >
              {errors.acceptedTerms.message}
            </span>
          )}
        </span>
      </label>

      {errors.root?.message && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700"
        >
          {errors.root.message}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="button-primary w-full sm:w-auto"
      >
        {isSubmitting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        {isSubmitting ? "Enviando solicitud…" : "Solicitar acceso"}
      </button>
      <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-green" />
        Tu cuenta comercial se habilitará únicamente después de la revisión.
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactElement<{
    id?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }>;
}) {
  const errorId = `${id}-error`;

  return (
    <label className="block text-sm font-bold text-brand-navy">
      {label}
      <span className="mt-2 block [&_input]:min-h-12 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-300 [&_input]:px-4 [&_input]:outline-none [&_input]:focus-visible:border-brand-blue [&_input]:focus-visible:ring-3 [&_input]:focus-visible:ring-brand-blue/20 [&_select]:min-h-12 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-4 [&_select]:outline-none [&_select]:focus-visible:border-brand-blue [&_select]:focus-visible:ring-3 [&_select]:focus-visible:ring-brand-blue/20">
        {cloneElement(children, {
          id,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": error ? errorId : undefined,
        })}
      </span>
      {error && (
        <span
          id={errorId}
          className="mt-1 block text-xs font-semibold text-rose-700"
        >
          {error}
        </span>
      )}
    </label>
  );
}
