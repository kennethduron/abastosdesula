"use client";

import { CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ChangePasswordForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-7 space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const values = new FormData(event.currentTarget);
        const response = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: String(values.get("password")),
            confirmPassword: String(values.get("confirmPassword")),
          }),
        });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(result.error ?? "No fue posible actualizar la contraseña.");
          setPending(false);
          return;
        }
        await fetch("/api/auth/session", { method: "DELETE" });
        router.replace("/acceso?passwordChanged=1");
      }}
    >
      <label className="block text-sm font-bold text-brand-navy">
        Nueva contraseña
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15"
        />
      </label>
      <label className="block text-sm font-bold text-brand-navy">
        Confirmar contraseña
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15"
        />
      </label>
      <p className="flex gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-green" />
        Usa al menos 10 caracteres, una letra y un número.
      </p>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="button-primary w-full"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <KeyRound className="size-4" />
        )}
        {pending ? "Actualizando…" : "Establecer contraseña"}
      </button>
    </form>
  );
}
