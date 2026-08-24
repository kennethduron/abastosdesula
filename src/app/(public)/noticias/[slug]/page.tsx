import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { demoAnnouncements } from "@/data/home-data";

function slugFromHref(href: string) {
  return href.split("/").filter(Boolean).at(-1)!;
}

export function generateStaticParams() {
  return demoAnnouncements.map((item) => ({ slug: slugFromHref(item.href) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = demoAnnouncements.find(
    (item) => slugFromHref(item.href) === slug,
  );
  return {
    title: article
      ? `${article.title} | Central de Abastos de Sula`
      : "Noticia no encontrada",
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = demoAnnouncements.find(
    (item) => slugFromHref(item.href) === slug,
  );
  if (!article) notFound();

  return (
    <main id="contenido-principal" className="bg-slate-50 py-12 sm:py-16">
      <Container>
        <article className="mx-auto max-w-3xl rounded-3xl border border-border bg-white p-7 shadow-sm sm:p-10">
          <p className="text-xs font-extrabold text-brand-green uppercase">
            {article.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-brand-navy">
            {article.title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            {article.description}
          </p>
          <div className="mt-8 rounded-2xl bg-brand-green-pale p-5 text-sm leading-6 text-brand-navy">
            Información preparada para ayudarte a comprar, cotizar y presentar
            tus productos con mayor claridad.
          </div>
          <Link href="/noticias" className="button-secondary mt-8">
            Volver a noticias
          </Link>
        </article>
      </Container>
    </main>
  );
}
