import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contacto | Central de Abastos de Sula",
};

export default function ContactPage() {
  return (
    <main id="contenido-principal" className="bg-slate-50 py-16 sm:py-24">
      <Container>
        <section className="mx-auto max-w-2xl rounded-3xl border border-border bg-white p-8 text-center shadow-sm sm:p-12">
          <p className="text-xs font-extrabold tracking-[0.16em] text-brand-green uppercase">
            Atención institucional
          </p>
          <h1 className="mt-4 text-4xl font-black text-brand-navy">Contacto</h1>
          <p className="mt-4 leading-7 text-slate-600">
            Escríbenos para conocer más sobre comerciantes, productos y
            oportunidades de colaboración con la institución.
          </p>
          <a
            href={siteConfig.whatsappDemoUrl}
            target="_blank"
            rel="noreferrer"
            className="button-primary mt-7"
          >
            Contactar por WhatsApp
          </a>
        </section>
      </Container>
    </main>
  );
}
