import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Promociones próximamente | Central de Abastos de Sula",
};

export default function PromotionsPage() {
  return (
    <main id="contenido-principal" className="bg-slate-50 py-16 sm:py-24">
      <Container>
        <section className="mx-auto max-w-2xl rounded-3xl border border-border bg-white p-8 text-center shadow-sm sm:p-12">
          <p className="text-xs font-extrabold tracking-[0.16em] text-brand-green uppercase">
            Módulo demo · Próximamente
          </p>
          <h1 className="mt-4 text-4xl font-black text-brand-navy">
            Promociones
          </h1>
          <p className="mt-4 leading-7 text-slate-600">
            Las promociones institucionales se publicarán cuando hayan sido
            confirmadas por los comerciantes.
          </p>
          <Link href="/comerciantes" className="button-primary mt-7">
            Ver comerciantes
          </Link>
        </section>
      </Container>
    </main>
  );
}
