import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import {
  demoBusinesses,
  demoCategories,
  demoProducts,
} from "@/data/adapters/mock/demo-data";

export function generateStaticParams() {
  return demoProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = demoProducts.find((item) => item.slug === slug);
  return product
    ? { title: `${product.name} | Central de Abastos de Sula` }
    : { title: "Producto no encontrado" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = demoProducts.find((item) => item.slug === slug);
  if (!product) notFound();
  const business = demoBusinesses.find(
    (item) => item.id === product.businessId,
  );
  const category = demoCategories.find(
    (item) => item.id === product.categoryId,
  );

  return (
    <main id="contenido-principal" className="bg-slate-50 py-12 sm:py-16">
      <Container>
        <Link href="/productos" className="text-sm font-bold text-brand-blue">
          ← Volver a productos
        </Link>
        <div className="mt-6 grid gap-8 rounded-3xl border border-border bg-white p-5 shadow-sm md:grid-cols-2 md:p-8">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
            <Image
              src={product.image}
              alt={product.imageAlt}
              fill
              priority
              sizes="(max-width: 767px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="self-center">
            <span className="rounded-full bg-brand-green-pale px-3 py-1 text-xs font-extrabold text-brand-green uppercase">
              Producto demo
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-brand-navy">
              {product.name}
            </h1>
            <p className="mt-4 leading-7 text-slate-600">
              {product.description}
            </p>
            <p className="mt-5 text-2xl font-black text-brand-green">
              L {(product.referencePrice.amountMinor / 100).toFixed(2)} /{" "}
              {product.unit}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Categoría: {category?.name ?? "General"}
            </p>
            {business && (
              <Link
                href={`/comerciantes/${business.slug}`}
                className="button-primary mt-7"
              >
                Ver comerciante y cotizar
              </Link>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}
