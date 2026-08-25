import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Brand } from "@/components/layout/brand";
import { getAppSessionState } from "@/data/adapters/firebase/session";

export const metadata: Metadata = {
  title: "Cambiar contraseña | Central de Abastos de Sula",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const state = await getAppSessionState();
  if (state.status !== "authenticated")
    redirect("/acceso?next=/cambiar-contrasena");
  if (state.session.role !== "merchant") redirect("/solicitud-recibida");
  if (!state.session.mustChangePassword) redirect("/panel");
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-brand-navy/10 sm:p-9">
        <Brand />
        <p className="mt-8 text-xs font-extrabold tracking-[0.16em] text-brand-green uppercase">
          Protege tu cuenta
        </p>
        <h1 className="mt-2 text-3xl font-black text-brand-navy">
          Crea una nueva contraseña
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          Antes de continuar, reemplaza la contraseña temporal por una que solo
          tú conozcas.
        </p>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
