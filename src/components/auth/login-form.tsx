"use client";

import { LockKeyhole, LogIn, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

import { getFirebaseAuth } from "@/data/adapters/firebase/auth-client";

export function LoginForm({
  firebaseAvailable,
  serviceUnavailable,
  clearSession,
  sessionExpired,
  localFallbackAvailable,
}: {
  firebaseAvailable: boolean;
  serviceUnavailable: boolean;
  clearSession: boolean;
  sessionExpired: boolean;
  localFallbackAvailable: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!clearSession) return;
    void fetch("/api/auth/session", { method: "DELETE" });
  }, [clearSession]);

  if (!firebaseAvailable) {
    return (
      <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex gap-3">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
          <div>
            <h2 className="font-extrabold text-amber-950">
              {serviceUnavailable
                ? "Servicio de acceso temporalmente no disponible"
                : "Firebase pendiente de configuración"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900/80">
              {serviceUnavailable
                ? "La configuración segura del servidor necesita atención. Intenta nuevamente más tarde."
                : localFallbackAvailable
                  ? "Firebase no está configurado. Los paneles locales demo están disponibles sólo para esta ejecución de QA."
                  : "La configuración de acceso todavía no está completa. Intenta nuevamente más tarde."}
            </p>
          </div>
        </div>
        {localFallbackAvailable && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a href="/panel" className="button-secondary">
              Panel comerciante local
            </a>
            <a href="/admin" className="button-secondary">
              Admin institucional local
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      className="mt-7 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const data = new FormData(event.currentTarget);
        try {
          const credential = await signInWithEmailAndPassword(
            getFirebaseAuth(),
            String(data.get("email")),
            String(data.get("password")),
          );
          const idToken = await credential.user.getIdToken();
          const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
          const result = (await response.json()) as {
            role?: string;
            error?: string;
          };
          if (!response.ok)
            throw new Error(result.error ?? "Acceso rechazado.");
          router.replace(
            result.role === "institutional_admin" ? "/admin" : "/panel",
          );
        } catch (submissionError) {
          setError(
            submissionError instanceof Error
              ? submissionError.message
              : "No fue posible iniciar sesión.",
          );
          setPending(false);
        }
      }}
    >
      {sessionExpired && (
        <p
          role="status"
          className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800"
        >
          Tu sesión expiró. Inicia sesión nuevamente.
        </p>
      )}
      <label className="block text-sm font-bold text-brand-navy">
        Correo electrónico
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 font-medium outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15"
        />
      </label>
      <label className="block text-sm font-bold text-brand-navy">
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 font-medium outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15"
        />
      </label>
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
          <LockKeyhole className="size-4" />
        ) : (
          <LogIn className="size-4" />
        )}
        {pending ? "Verificando…" : "Iniciar sesión"}
      </button>
      <p className="text-center text-xs leading-5 text-slate-500">
        Las credenciales demo se configuran fuera del repositorio.
      </p>
    </form>
  );
}
