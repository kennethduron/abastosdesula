"use client";

import { Minus, PackageSearch, Plus, Search, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useDeferredValue, useMemo, useState } from "react";

import { useCart } from "@/components/cart/cart-provider";

export interface CatalogProductItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  unit: string;
  priceMinor: number;
  availability: "available" | "limited" | "unavailable";
}

interface CatalogCategoryItem {
  id: string;
  name: string;
}

const formatMoney = (amountMinor: number) =>
  new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function MerchantCatalog({
  businessId,
  businessName,
  whatsappDemo,
  products,
  categories,
}: {
  businessId: string;
  businessName: string;
  whatsappDemo: string;
  products: CatalogProductItem[];
  categories: CatalogCategoryItem[];
}) {
  const { addItem } = useCart();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const deferredSearch = useDeferredValue(search);

  const filteredProducts = useMemo(() => {
    const term = normalize(deferredSearch.trim());
    return products.filter((product) => {
      if (category !== "all" && product.categoryId !== category) return false;
      if (
        term &&
        !normalize(`${product.name} ${product.description}`).includes(term)
      )
        return false;
      return true;
    });
  }, [category, deferredSearch, products]);

  const quantityFor = (productId: string) => quantities[productId] ?? 1;
  const setQuantity = (productId: string, quantity: number) =>
    setQuantities((current) => ({
      ...current,
      [productId]: Math.max(1, quantity),
    }));

  return (
    <section aria-labelledby="catalog-heading">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[0.16em] text-brand-green uppercase">
            Catálogo del comerciante
          </p>
          <h2
            id="catalog-heading"
            className="mt-2 text-3xl font-extrabold tracking-[-0.035em] text-brand-navy sm:text-4xl"
          >
            Productos disponibles
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Selecciona cantidades de referencia y prepara una solicitud para un
            solo comerciante.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:w-[520px]">
          <label className="relative block">
            <span className="sr-only">Buscar en este catálogo</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar producto..."
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-sm outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/10"
            />
          </label>
          <label>
            <span className="sr-only">Filtrar catálogo por categoría</span>
            <select
              aria-label="Filtrar catálogo por categoría"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-brand-navy outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/10"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filteredProducts.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const quantity = quantityFor(product.id);
            return (
              <article
                key={product.id}
                data-testid="catalog-product"
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-navy/8"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image
                    src={product.image}
                    alt={product.imageAlt}
                    fill
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-white/92 px-2.5 py-1 text-[0.65rem] font-extrabold text-brand-green shadow-sm">
                    {product.availability === "unavailable"
                      ? "Agotado"
                      : product.availability === "limited"
                        ? "Stock bajo"
                        : "Disponible"}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-extrabold text-brand-navy">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-xs font-bold text-brand-green">
                    {formatMoney(product.priceMinor)} / {product.unit}
                  </p>
                  <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
                    {product.description}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="inline-flex shrink-0 items-center rounded-xl border border-slate-200">
                      <button
                        type="button"
                        disabled={product.availability === "unavailable"}
                        aria-label={`Reducir cantidad de ${product.name}`}
                        onClick={() => setQuantity(product.id, quantity - 1)}
                        className="grid size-11 place-items-center text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-blue"
                      >
                        <Minus className="size-3.5" aria-hidden="true" />
                      </button>
                      <span className="min-w-7 text-center text-sm font-extrabold text-brand-navy">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        disabled={product.availability === "unavailable"}
                        aria-label={`Aumentar cantidad de ${product.name}`}
                        onClick={() => setQuantity(product.id, quantity + 1)}
                        className="grid size-11 place-items-center text-brand-green hover:bg-brand-green-pale focus-visible:outline-2 focus-visible:outline-brand-blue"
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={product.availability === "unavailable"}
                      onClick={() =>
                        addItem({
                          productId: product.id,
                          businessId,
                          businessName,
                          whatsappDemo,
                          productName: product.name,
                          image: product.image,
                          imageAlt: product.imageAlt,
                          priceMinor: product.priceMinor,
                          unit: product.unit,
                          quantity,
                        })
                      }
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-green px-3 text-xs font-extrabold text-white hover:bg-brand-green-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <ShoppingCart className="size-4" aria-hidden="true" />
                      Agregar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white py-14 text-center">
          <PackageSearch
            className="mx-auto size-8 text-brand-green"
            aria-hidden="true"
          />
          <h3 className="mt-4 text-lg font-extrabold text-brand-navy">
            No encontramos productos
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Prueba otro término o categoría.
          </p>
        </div>
      )}
    </section>
  );
}
