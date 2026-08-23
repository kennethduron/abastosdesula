import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { Brand } from "@/components/layout/brand";
import { isFirebaseClientConfigured } from "@/data/adapters/firebase/config";

export const metadata: Metadata = {
  title: "Acceso demo | Central de Abastos de Sula",
  description: "Acceso de comerciantes y administración institucional.",
  robots: { index: false, follow: false },
};

export default function AccessPage() {
  const firebaseAvailable = isFirebaseClientConfigured();
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
        <LoginForm firebaseAvailable={firebaseAvailable} />
      </section>
    </main>
  );
}
