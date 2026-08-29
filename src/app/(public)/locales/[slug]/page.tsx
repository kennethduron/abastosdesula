import type { Metadata } from "next";
import { ArrowLeft, Check, Clock3, MapPin, Ruler, Store } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { LeasingInquiryDialog } from "@/components/spaces/leasing-inquiry-dialog";
import { SpaceGallery } from "@/components/spaces/space-gallery";
import { presentationCommercialSpaces } from "@/data/commercial-spaces";
import { getPublicCommercialSpace } from "@/data/public-commercial-spaces";

export async function generateStaticParams() {
  return presentationCommercialSpaces.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const space = await getPublicCommercialSpace(slug);
  if (!space) return { title: "Espacio no encontrado" };
  return {
    title: `${space.title} | Central de Abastos de Sula`,
    description: space.shortDescription,
    alternates: { canonical: `/locales/${space.slug}` },
    openGraph: {
      title: `${space.title} | Central de Abastos de Sula`,
      description: space.shortDescription,
      url: `/locales/${space.slug}`,
      images: [{ url: space.coverImage.src, alt: space.coverImage.alt }],
    },
  };
}

export default async function CommercialSpaceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const space = await getPublicCommercialSpace(slug);
  if (!space) notFound();
  return (
    <main
      id="contenido-principal"
      className="min-w-0 flex-1 bg-brand-surface pb-24 md:pb-0"
    >
      <Container className="py-6 sm:py-9">
        <Link href="/locales" prefetch={false} className="text-link">
          <ArrowLeft className="size-4" />
          Volver a locales
        </Link>
        <div className="mt-5 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)] lg:items-start">
          <div className="min-w-0">
            <SpaceGallery images={space.images} />
          </div>
          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:sticky lg:top-24">
            <span className="inline-flex rounded-full bg-brand-green-pale px-3 py-1.5 text-xs font-extrabold text-brand-green-dark">
              Disponible para consulta
            </span>
            <p className="mt-5 text-xs font-extrabold tracking-[0.12em] text-brand-blue uppercase">
              {space.type}
            </p>
            <h1 className="mt-2 text-3xl leading-tight font-black tracking-[-0.04em] text-brand-navy sm:text-4xl">
              {space.title}
            </h1>
            <p className="mt-4 leading-7 text-slate-600">
              {space.shortDescription}
            </p>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Info
                icon={Ruler}
                label="Dimensión"
                value={space.approximateArea}
              />
              <Info
                icon={MapPin}
                label="Ubicación interna"
                value={space.locationLabel}
              />
              <Info icon={Store} label="Tipo" value={space.type} />
              <Info icon={Clock3} label="Condiciones" value="Consultar" />
            </dl>
            <LeasingInquiryDialog
              spaceId={space.id}
              spaceTitle={space.title}
              buttonClassName="button-primary mt-7 w-full"
            />
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Disponibilidad y condiciones sujetas a confirmación por la
              administración.
            </p>
          </aside>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-extrabold tracking-[0.12em] text-brand-green uppercase">
              El espacio
            </p>
            <h2 className="mt-2 text-2xl font-black text-brand-navy">
              Descripción y características
            </h2>
            <p className="mt-4 leading-7 text-slate-600">{space.description}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {space.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-green" />
                  {feature}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl bg-brand-navy p-6 text-white shadow-sm sm:p-8">
            <p className="text-xs font-extrabold tracking-[0.12em] text-brand-green-light uppercase">
              Usos recomendados
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Una base para su operación
            </h2>
            <ul className="mt-5 space-y-3">
              {space.suitableFor.map((use) => (
                <li
                  key={use}
                  className="flex items-center gap-3 rounded-xl bg-white/8 p-3 text-sm font-semibold"
                >
                  <Check className="size-4 text-brand-green-light" />
                  {use}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Container>
      <div
        data-testid="mobile-leasing-cta"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
      >
        <LeasingInquiryDialog
          spaceId={space.id}
          spaceTitle={space.title}
          buttonClassName="button-primary w-full"
        />
      </div>
    </main>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Ruler;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <dt className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Icon className="size-4 text-brand-green" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-extrabold text-brand-navy">{value}</dd>
    </div>
  );
}
