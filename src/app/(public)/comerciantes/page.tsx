import { BadgeCheck, Building2, PackageSearch, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

import {
  MerchantDirectory,
  type MerchantDirectoryItem,
} from "@/components/merchants/merchant-directory";
import { Container } from "@/components/layout/container";
import { getRepositories } from "@/data/repository-provider";

export const metadata: Metadata = {
  title: "Directorio de comerciantes | Central de Abastos de Sula",
  description:
    "Explora perfiles y catálogos de comerciantes organizados por categoría.",
};

export default async function MerchantsPage() {
  const repositories = getRepositories();
  const [merchants, categories, productPage] = await Promise.all([
    repositories.merchants.list({ status: "active" }),
    repositories.categories.list(),
    repositories.products.list({ page: 1, pageSize: 48 }),
  ]);
  const categoryById = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const productById = new Map(
    productPage.items.map((product) => [product.id, product.name]),
  );
  const directoryMerchants: MerchantDirectoryItem[] = merchants.map(
    (merchant) => ({
      id: merchant.id,
      slug: merchant.slug,
      name: merchant.displayName,
      description: merchant.description,
      image: merchant.image,
      imageAlt: merchant.imageAlt,
      status: merchant.status,
      categoryIds: merchant.categoryIds,
      categoryNames: merchant.categoryIds
        .map((id) => categoryById.get(id))
        .filter((name): name is string => Boolean(name)),
      featuredProducts: merchant.featuredProductIds
        .map((id) => productById.get(id))
        .filter((name): name is string => Boolean(name)),
      whatsappDemo: merchant.whatsappDemo ?? "50400000000",
    }),
  );

  return (
    <main
      id="contenido-principal"
      className="min-w-0 overflow-clip bg-brand-surface"
    >
      <section className="relative isolate overflow-hidden bg-brand-navy py-14 sm:py-18 lg:py-22">
        <Image
          src="/images/home/hero-market.webp"
          alt=""
          fill
          preload
          sizes="100vw"
          className="-z-20 object-cover object-[68%_center] opacity-60"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,26,51,0.98)_0%,rgba(7,26,51,0.91)_48%,rgba(7,26,51,0.48)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(66,185,92,0.18),transparent_38%)]" />

        <Container>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-3 py-1.5 text-xs font-extrabold text-brand-green-light backdrop-blur-sm">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Directorio de comerciantes
            </div>
            <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.98] font-extrabold tracking-[-0.055em] text-white">
              Encuentra comerciantes para cada necesidad
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
              Explora perfiles por categoría, conoce productos destacados y
              contacta directamente con el proveedor que necesitas.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold text-white/85 sm:text-sm">
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-brand-navy/35 px-3.5 py-2.5 backdrop-blur-sm">
                <Building2
                  className="size-4 text-brand-green-light"
                  aria-hidden="true"
                />
                {directoryMerchants.length} perfiles disponibles
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-brand-navy/35 px-3.5 py-2.5 backdrop-blur-sm">
                <PackageSearch
                  className="size-4 text-brand-green-light"
                  aria-hidden="true"
                />
                {categories.length} categorías
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-brand-navy/35 px-3.5 py-2.5 backdrop-blur-sm">
                <BadgeCheck
                  className="size-4 text-brand-green-light"
                  aria-hidden="true"
                />
                Información comercial
              </span>
            </div>
          </div>
        </Container>
      </section>

      <Container className="relative z-10 -mt-8 pb-20 sm:-mt-10 sm:pb-24">
        <MerchantDirectory
          merchants={directoryMerchants}
          categories={categories.map(({ id, name }) => ({ id, name }))}
        />
      </Container>
    </main>
  );
}
