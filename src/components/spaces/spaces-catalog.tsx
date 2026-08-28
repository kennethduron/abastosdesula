"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import type { CommercialSpace } from "@/domain";
import { CommercialSpaceCard } from "./commercial-space-card";

export function SpacesCatalog({ spaces }: { spaces: CommercialSpace[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const types = [...new Set(spaces.map((space) => space.type))];
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    return spaces.filter(
      (space) =>
        (type === "all" || space.type === type) &&
        (!term ||
          [
            space.title,
            space.type,
            space.locationLabel,
            ...space.features,
            ...space.suitableFor,
          ]
            .join(" ")
            .toLocaleLowerCase("es")
            .includes(term)),
    );
  }, [query, spaces, type]);

  return (
    <div>
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[1fr_260px] sm:p-4">
        <label className="relative block">
          <span className="sr-only">Buscar espacios</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por uso o característica"
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-4 pl-12 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
          />
        </label>
        <label className="relative block">
          <span className="sr-only">Filtrar por tipo</span>
          <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="min-h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pr-4 pl-11 text-sm font-semibold text-brand-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15"
          >
            <option value="all">Todos los tipos</option>
            {types.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <p
        className="mt-5 text-sm font-semibold text-slate-500"
        aria-live="polite"
      >
        {filtered.length}{" "}
        {filtered.length === 1 ? "espacio encontrado" : "espacios encontrados"}
      </p>
      {filtered.length ? (
        <div className="mt-5 grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((space) => (
            <CommercialSpaceCard key={space.id} space={space} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="font-black text-brand-navy">
            No encontramos espacios con esos criterios.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setType("all");
            }}
            className="text-link mt-3"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
