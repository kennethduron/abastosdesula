import { CheckCircle2, Clock3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Solicitud recibida | Central de Abastos de Sula",
  robots: { index: false, follow: false },
};

export default function ApplicationReceivedPage() {
  return (
    <main
      id="contenido-principal"
      className="grid min-h-[70dvh] place-items-center bg-slate-50 py-14"
    >
      <Container>
        <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl shadow-brand-navy/5 sm:p-10">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-green-pale text-brand-green-dark">
            <CheckCircle2 className="size-8" />
          </span>
          <h1 className="mt-6 text-3xl font-black text-brand-navy sm:text-4xl">
            Solicitud recibida
          </h1>
          <p className="mt-4 leading-7 text-slate-600">
            La Central revisará la información antes de habilitar el acceso
            comercial. Podrás ingresar cuando la cuenta haya sido autorizada.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            <Clock3 className="size-4" /> Revisión pendiente
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link href="/" className="button-secondary">
              Volver al inicio
            </Link>
            <Link href="/acceso" className="button-primary">
              Ir a acceso
            </Link>
          </div>
        </section>
      </Container>
    </main>
  );
}
