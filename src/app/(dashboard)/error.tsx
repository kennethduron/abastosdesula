"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] rendering failed", {
      digest: error.digest ?? "unavailable",
      name: error.name,
    });
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-amber-200 bg-white p-7 text-center shadow-xl">
        <TriangleAlert
          className="mx-auto size-10 text-amber-600"
          aria-hidden="true"
        />
        <h1 className="mt-5 text-2xl font-black text-brand-navy">
          Servicio temporalmente no disponible
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          No pudimos cargar este panel de forma segura. Puedes volver a intentar
          o iniciar sesión nuevamente.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={retry} className="button-primary">
            Intentar nuevamente
          </button>
          <Link href="/acceso" className="button-secondary">
            Volver al acceso
          </Link>
        </div>
      </section>
    </main>
  );
}
