import type { Metadata } from "next";
import { Building2, ShieldCheck } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SpacesCatalog } from "@/components/spaces/spaces-catalog";
import { getPublicCommercialSpaces } from "@/data/public-commercial-spaces";

export const metadata: Metadata = {
  title: "Locales disponibles | Central de Abastos de Sula",
  description:
    "Conoce espacios comerciales disponibles y solicita información directamente con Central de Abastos de Sula.",
  alternates: { canonical: "/locales" },
  openGraph: {
    title: "Locales disponibles | Central de Abastos de Sula",
    description:
      "Espacios comerciales dentro de Central de Abastos de Sula. Consulta características y solicita información con la administración.",
    url: "/locales",
    images: [
      {
        url: "/images/spaces/local-comercial-amplio.webp",
        alt: "Espacios comerciales en Central de Abastos de Sula",
      },
    ],
  },
};

export default async function CommercialSpacesPage() {
  const spaces = await getPublicCommercialSpaces();
  return (
    <main
      id="contenido-principal"
      className="min-w-0 flex-1 overflow-clip bg-brand-surface"
    >
      <section className="relative overflow-hidden bg-brand-navy py-14 text-white sm:py-20">
        <div className="absolute -top-28 right-0 size-80 rounded-full bg-brand-green/20 blur-3xl" />
        <Container className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-[0.12em] text-brand-green-light uppercase">
            <Building2 className="size-4" />
            Oportunidades comerciales
          </span>
          <h1 className="mt-5 max-w-4xl text-4xl leading-tight font-black tracking-[-0.04em] sm:text-6xl">
            Locales disponibles dentro de la Central
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
            Encuentra espacios pensados para comercio, alimentos y distribución,
            y solicita información directamente con nuestra administración.
          </p>
          <p className="mt-6 inline-flex max-w-2xl items-start gap-2 rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-xs leading-5 text-slate-200">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-green-light" />
            Disponibilidad, características y condiciones sujetas a confirmación
            por la administración.
          </p>
        </Container>
      </section>
      <section className="py-10 sm:py-14 lg:py-18">
        <Container>
          <SpacesCatalog spaces={spaces} />
        </Container>
      </section>
    </main>
  );
}
