"use client";

import { Search, Store, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { MerchantDirectoryCard } from "@/components/merchants/merchant-directory-card";

export interface MerchantDirectoryItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  status: "active" | "inactive" | "pending";
  categoryIds: string[];
  categoryNames: string[];
  featuredProducts: string[];
  whatsappDemo: string;
}

export interface MerchantDirectoryCategory {
  id: string;
  name: string;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-HN");
}

export function MerchantDirectory({
  merchants,
  categories,
}: {
  merchants: MerchantDirectoryItem[];
  categories: MerchantDirectoryCategory[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("active");
  const [sort, setSort] = useState("relevance");
  const deferredSearch = useDeferredValue(search);

  const filteredMerchants = useMemo(() => {
    const term = normalize(deferredSearch.trim());
    const filtered = merchants.filter((merchant) => {
      if (category !== "all" && !merchant.categoryIds.includes(category)) {
        return false;
      }
      if (availability !== "all" && merchant.status !== availability) {
        return false;
      }
      if (
        term &&
        !normalize(
          `${merchant.name} ${merchant.description} ${merchant.categoryNames.join(" ")} ${merchant.featuredProducts.join(" ")}`,
        ).includes(term)
      ) {
        return false;
      }
      return true;
    });

    if (sort === "name") {
      return [...filtered].sort((a, b) =>
        a.name.localeCompare(b.name, "es-HN"),
      );
    }
    return filtered;
  }, [availability, category, deferredSearch, merchants, sort]);

  const hasFilters =
    search.length > 0 || category !== "all" || availability !== "active";

  function clearFilters() {
    setSearch("");
    setCategory("all");
    setAvailability("active");
  }

  return (
    <section aria-labelledby="directory-results-heading">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-brand-navy/5 sm:p-5 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr_0.72fr]">
          <label className="block">
            <span className="mb-2 block text-xs font-extrabold text-brand-navy">
              Buscar comerciante o producto
            </span>
            <span className="relative block">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre, categoría o producto..."
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-10 text-sm text-brand-navy transition outline-none focus:border-brand-blue focus:bg-white focus:ring-3 focus:ring-brand-blue/10"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-brand-blue"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-extrabold text-brand-navy">
              Categoría
            </span>
            <select
              aria-label="Categoría"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-brand-navy transition outline-none focus:border-brand-blue focus:bg-white focus:ring-3 focus:ring-brand-blue/10"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-extrabold text-brand-navy">
              Disponibilidad
            </span>
            <select
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-brand-navy transition outline-none focus:border-brand-blue focus:bg-white focus:ring-3 focus:ring-brand-blue/10"
            >
              <option value="active">Disponibles</option>
              <option value="all">Todos los estados</option>
            </select>
          </label>
        </div>

        <div
          className="mt-5 flex gap-2 overflow-x-auto pb-1"
          aria-label="Filtros rápidos por categoría"
        >
          <button
            type="button"
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
            className="min-h-10 shrink-0 rounded-full border border-slate-200 px-4 text-xs font-extrabold text-slate-600 transition-colors hover:border-brand-green/30 hover:text-brand-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue aria-pressed:border-brand-green aria-pressed:bg-brand-green-pale aria-pressed:text-brand-green"
          >
            Todos
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
              className="min-h-10 shrink-0 rounded-full border border-slate-200 px-4 text-xs font-extrabold text-slate-600 transition-colors hover:border-brand-green/30 hover:text-brand-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue aria-pressed:border-brand-green aria-pressed:bg-brand-green-pale aria-pressed:text-brand-green"
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[0.16em] text-brand-green uppercase">
            Directorio de comerciantes
          </p>
          <h2
            id="directory-results-heading"
            className="mt-1 text-xl font-extrabold text-brand-navy"
            aria-live="polite"
          >
            {filteredMerchants.length} comerciantes encontrados
          </h2>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
          Ordenar por
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-brand-navy outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/10"
          >
            <option value="relevance">Más relevantes</option>
            <option value="name">Nombre A–Z</option>
          </select>
        </label>
      </div>

      {filteredMerchants.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMerchants.map((merchant) => (
            <MerchantDirectoryCard key={merchant.id} merchant={merchant} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-green-pale text-brand-green">
            <Store className="size-7" aria-hidden="true" />
          </span>
          <h3 className="mt-5 text-xl font-extrabold text-brand-navy">
            No encontramos coincidencias
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Prueba otro nombre o selecciona una categoría diferente.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 min-h-11 rounded-xl bg-brand-blue px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand-blue/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </section>
  );
}
