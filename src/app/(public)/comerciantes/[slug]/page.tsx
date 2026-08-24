import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  Layers3,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { MerchantCatalog } from "@/components/merchants/merchant-catalog";
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
    title: `${merchant.displayName} | Central de Abastos de Sula`,
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
    `Hola, vi el perfil de ${merchant.displayName} en la plataforma de Central de Abastos de Sula.`,
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
              Comerciante verificado
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
              Contactar por WhatsApp
            </a>
          </div>
        </Container>
      </section>

      <Container className="relative z-10 -mt-6 py-12 sm:-mt-8 sm:py-16">
        <div className="mb-12 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Layers3,
              title: "Categorías",
              value: merchantCategories.map(({ name }) => name).join(", "),
            },
            {
              icon: Clock3,
              title: "Atención",
              value: "Horario por confirmar",
            },
            {
              icon: ShieldCheck,
              title: "Solicitud",
              value: "Un carrito por comerciante",
            },
          ].map(({ icon: Icon, title, value }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-brand-navy/5"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-brand-green-pale text-brand-green">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-xs font-extrabold text-brand-navy">
                {title}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{value}</p>
            </div>
          ))}
        </div>

        <MerchantCatalog
          businessId={merchant.businessId}
          businessName={merchant.displayName}
          whatsappDemo={merchant.whatsappDemo ?? "50400000000"}
          categories={merchantCategories.map(({ id, name }) => ({ id, name }))}
          products={productPage.items.map((product) => ({
            id: product.id,
            categoryId: product.categoryId,
            name: product.name,
            description: product.description,
            image: product.image,
            imageAlt: product.imageAlt,
            unit: product.unit,
            priceMinor: product.referencePrice.amountMinor,
            availability: product.availability,
          }))}
        />
      </Container>
    </main>
  );
}
