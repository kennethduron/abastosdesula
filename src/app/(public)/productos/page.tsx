import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { MarketplaceSearch } from "@/components/forms/marketplace-search";
import { demoCategories } from "@/data/adapters/mock/demo-data";
import { getPublicCatalog } from "@/data/adapters/firebase/public-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Productos | Central de Abastos de Sula",
  description: "Explora productos, comerciantes y precios de referencia.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>;
}) {
  const params = await searchParams;
  const { businesses, products: publicProducts } = await getPublicCatalog();
  const query = params.q?.trim().toLocaleLowerCase("es-HN") ?? "";
  const category = demoCategories.find(
    (item) => item.slug === params.categoria,
  );
  const products = publicProducts.filter((product) => {
    const business = businesses.find((item) => item.id === product.businessId);
    const matchesCategory = !category || product.categoryId === category.id;
    const matchesQuery =
      !query ||
      `${product.name} ${product.description} ${business?.name ?? ""}`
        .toLocaleLowerCase("es-HN")
        .includes(query);
    return matchesCategory && matchesQuery;
  });

  return (
    <main id="contenido-principal" className="bg-slate-50 py-12 sm:py-16">
      <Container>
        <p className="text-xs font-extrabold tracking-[0.16em] text-brand-green uppercase">
          Catálogo comercial
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-brand-navy sm:text-5xl">
          Productos disponibles
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">
          Explora precios de referencia y abre el perfil del comerciante para
          preparar una cotización.
        </p>
        <div className="mt-7 max-w-2xl">
          <MarketplaceSearch compact />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/productos" className="button-secondary">
            Todas
          </Link>
          {demoCategories.map((item) => (
            <Link
              key={item.id}
              href={`/productos?categoria=${item.slug}`}
              className="button-secondary"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {products.length ? (
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const business = businesses.find(
                (item) => item.id === product.businessId,
              );
              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
                >
                  <Link href={`/productos/${product.slug}`} className="block">
                    <div className="relative aspect-[4/3] bg-slate-100">
                      <Image
                        src={product.image}
                        alt={product.imageAlt}
                        fill
                        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <span className="text-xs font-bold text-brand-green uppercase">
                        Precio de referencia
                      </span>
                      <h2 className="mt-2 text-lg font-extrabold text-brand-navy">
                        {product.name}
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        {business?.name}
                      </p>
                      <p className="mt-3 font-bold text-brand-green">
                        L{" "}
                        {(product.referencePrice.amountMinor / 100).toFixed(2)}{" "}
                        / {product.unit}
                      </p>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-9 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            No encontramos productos con esos filtros.
          </p>
        )}
      </Container>
    </main>
  );
}
