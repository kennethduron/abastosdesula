import { BadgeCheck, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { MerchantRegistrationForm } from "@/components/auth/merchant-registration-form";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Solicitar acceso comercial | Central de Abastos de Sula",
  description: "Solicitud de acceso al portal para comerciantes de la Central.",
  robots: { index: false, follow: false },
};

export default function MerchantRegistrationPage() {
  return (
    <main id="contenido-principal" className="bg-slate-50 py-12 sm:py-16">
      <Container>
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-brand-navy/5 sm:p-9">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-green-pale px-3 py-1.5 text-xs font-extrabold text-brand-green-dark">
              <BadgeCheck className="size-4" /> Portal del comerciante
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-brand-navy sm:text-5xl">
              Solicita acceso para tu negocio
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-600">
              Completa la información básica. La Central revisará la solicitud
              antes de habilitar las herramientas comerciales.
            </p>
            <MerchantRegistrationForm />
          </div>
          <p className="mx-auto mt-5 flex max-w-2xl items-start justify-center gap-2 text-center text-xs leading-5 text-slate-500">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            La información de clientes, inventario y estado de cuenta permanece
            privada para cada negocio autorizado.
          </p>
        </div>
      </Container>
    </main>
  );
}
