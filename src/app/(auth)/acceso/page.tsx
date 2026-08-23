import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { Brand } from "@/components/layout/brand";
import {
  getFirebaseAdminConfigStatus,
  isLocalFirebaseFallbackAllowed,
} from "@/data/adapters/firebase/admin-config";
import { getFirebaseClientConfigStatus } from "@/data/adapters/firebase/config";

export const metadata: Metadata = {
  title: "Acceso demo | Central de Abastos de Sula",
  description: "Acceso de comerciantes y administración institucional.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ clearSession?: string; error?: string }>;
}) {
  const params = await searchParams;
  const clientStatus = getFirebaseClientConfigStatus();
  const adminStatus = getFirebaseAdminConfigStatus();
  const localFallbackAvailable = isLocalFirebaseFallbackAllowed();
  const firebaseAvailable = clientStatus === "ready" && adminStatus === "ready";
  const serviceUnavailable =
    params.error === "service" ||
    (clientStatus === "ready" && adminStatus !== "ready");
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_top_right,_rgba(22,155,69,0.12),_transparent_34%),linear-gradient(135deg,#f8fafc,#edf4f8)] px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-brand-navy/10 sm:p-9">
        <Brand />
        <p className="mt-8 text-xs font-extrabold tracking-[0.16em] text-brand-green uppercase">
          Acceso seguro
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-brand-navy sm:text-4xl">
          Inicia sesión en la demo
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          Acceso reservado para comerciantes y administración institucional.
        </p>
        <LoginForm
          firebaseAvailable={firebaseAvailable}
          serviceUnavailable={serviceUnavailable}
          clearSession={params.clearSession === "1"}
          sessionExpired={params.error === "session"}
          localFallbackAvailable={localFallbackAvailable}
        />
      </section>
    </main>
  );
}
