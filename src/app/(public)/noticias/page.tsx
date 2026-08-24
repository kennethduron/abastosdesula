import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { demoAnnouncements } from "@/data/home-data";

export const metadata: Metadata = {
  title: "Noticias | Central de Abastos de Sula",
};

export default function NewsPage() {
  return (
    <main id="contenido-principal" className="bg-slate-50 py-12 sm:py-16">
      <Container>
        <p className="text-xs font-extrabold tracking-[0.16em] text-brand-green uppercase">
          Actualidad y recursos
        </p>
        <h1 className="mt-3 text-4xl font-black text-brand-navy sm:text-5xl">
          Noticias y guías
        </h1>
        <div className="mt-9 grid gap-5 lg:grid-cols-3">
          {demoAnnouncements.map((item) => (
            <article
              key={item.href}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-bold text-brand-green uppercase">
                {item.eyebrow}
              </p>
              <h2 className="mt-3 text-xl font-extrabold text-brand-navy">
                {item.title}
              </h2>
              <p className="mt-3 leading-7 text-slate-600">
                {item.description}
              </p>
              <Link
                href={item.href}
                className="mt-5 inline-block font-bold text-brand-blue"
              >
                Leer artículo →
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </main>
  );
}
