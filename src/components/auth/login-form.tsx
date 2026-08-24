"use client";

import { Eye, EyeOff, LockKeyhole, LogIn, TriangleAlert } from "lucide-react";
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
  const [passwordVisible, setPasswordVisible] = useState(false);

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
              Servicio de acceso temporalmente no disponible
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900/80">
              {serviceUnavailable
                ? "No pudimos completar el acceso en este momento. Intenta nuevamente más tarde."
                : localFallbackAvailable
                  ? "Puedes continuar con el acceso de revisión autorizado."
                  : "El servicio de acceso todavía no está disponible. Intenta nuevamente más tarde."}
            </p>
          </div>
        </div>
        {localFallbackAvailable && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a href="/panel" className="button-secondary">
              Panel del comerciante
            </a>
            <a href="/admin" className="button-secondary">
              Administración
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
          router.replace(result.role === "merchant" ? "/panel" : "/admin");
        } catch (submissionError) {
          void submissionError;
          setError(
            "No pudimos iniciar sesión. Revisa tus credenciales e inténtalo de nuevo.",
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
      <div className="block text-sm font-bold text-brand-navy">
        <label htmlFor="password">Contraseña</label>
        <span className="relative mt-2 block">
          <input
            id="password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete="current-password"
            required
            minLength={8}
            className="min-h-12 w-full rounded-xl border border-slate-300 pr-14 pl-4 font-medium outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15"
          />
          <button
            type="button"
            aria-label={
              passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            aria-pressed={passwordVisible}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setPasswordVisible((visible) => !visible)}
            className="absolute inset-y-0 right-0 grid min-h-12 min-w-12 place-items-center rounded-r-xl text-slate-500 hover:bg-slate-50 hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand-blue"
          >
            {passwordVisible ? (
              <EyeOff className="size-5" aria-hidden="true" />
            ) : (
              <Eye className="size-5" aria-hidden="true" />
            )}
          </button>
        </span>
      </div>
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
        Acceso exclusivo para comerciantes y personal autorizado.
      </p>
    </form>
  );
}
