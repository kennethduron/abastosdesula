import { ArrowLeft, BadgeCheck, MessageCircle, Package } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { getRepositories } from "@/data/repository-provider";

interface MerchantProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const merchants = await getRepositories().merchants.list();
  return merchants.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: MerchantProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const merchant = await getRepositories().merchants.getBySlug(slug);
  if (!merchant) return { title: "Comerciante no encontrado" };
  return {
    title: `${merchant.displayName} | Directorio demo`,
    description: merchant.description,
  };
}

export default async function MerchantProfilePage({
  params,
}: MerchantProfilePageProps) {
  const { slug } = await params;
  const repositories = getRepositories();
  const merchant = await repositories.merchants.getBySlug(slug);
  if (!merchant) notFound();

  const [categories, productPage] = await Promise.all([
    repositories.categories.list(),
    repositories.products.list({
      businessId: merchant.businessId,
      page: 1,
      pageSize: 12,
    }),
  ]);
  const merchantCategories = categories.filter((category) =>
    merchant.categoryIds.includes(category.id),
  );
  const whatsappMessage = encodeURIComponent(
    `Hola, vi el perfil demo de ${merchant.displayName} en la plataforma de Central de Abastos de Sula.`,
  );

  return (
    <main
      id="contenido-principal"
      className="min-w-0 flex-1 bg-brand-surface pb-20"
    >
      <section className="relative isolate overflow-hidden bg-brand-navy py-12 sm:py-16">
        <Image
          src={merchant.image}
          alt=""
          fill
          preload
          sizes="100vw"
          className="-z-20 object-cover opacity-45"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,26,51,0.98),rgba(7,26,51,0.76))]" />
        <Container>
          <Link
            href="/comerciantes"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-white/80 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver al directorio
          </Link>
          <div className="mt-7 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-green-light/30 bg-brand-green/18 px-3 py-1.5 text-xs font-extrabold text-brand-green-light">
              <BadgeCheck className="size-4" aria-hidden="true" />
              Perfil demostrativo
            </span>
            <h1 className="mt-4 text-4xl leading-tight font-extrabold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              {merchant.displayName}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              {merchant.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {merchantCategories.map((category) => (
                <span
                  key={category.id}
                  className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-bold text-white/85"
                >
                  {category.name}
                </span>
              ))}
            </div>
            <a
              href={`https://wa.me/${merchant.whatsappDemo}?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
              className="button-whatsapp mt-7"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Abrir WhatsApp demo
            </a>
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold tracking-[0.16em] text-brand-green uppercase">
              Catálogo inicial · Demo
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] text-brand-navy">
              Productos destacados
            </h2>
          </div>
          <Package
            className="hidden size-8 text-brand-green sm:block"
            aria-hidden="true"
          />
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {productPage.items.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <Image
                  src={product.image}
                  alt={product.imageAlt}
                  fill
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <p className="text-xs font-extrabold text-brand-green">
                  Disponible · Demo
                </p>
                <h2 className="mt-1 text-lg font-extrabold text-brand-navy">
                  {product.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {product.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </main>
  );
}
