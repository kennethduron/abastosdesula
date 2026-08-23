import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

interface MarketplaceSearchProps {
  compact?: boolean;
}

export function MarketplaceSearch({ compact = false }: MarketplaceSearchProps) {
  return (
    <form
      role="search"
      action="/productos"
      method="get"
      className={cn(
        "flex w-full items-center gap-2 rounded-2xl border border-border bg-white p-2 shadow-xl shadow-brand-navy/8 transition-[border-color,box-shadow] duration-300 focus-within:border-brand-blue focus-within:shadow-2xl focus-within:ring-4 focus-within:shadow-brand-blue/10 focus-within:ring-brand-blue/10",
        compact && "shadow-sm",
      )}
    >
      <Search
        className="ml-2 size-5 shrink-0 text-slate-400"
        aria-hidden="true"
      />
      <label htmlFor="marketplace-search" className="sr-only">
        Buscar productos o comerciantes
      </label>
      <input
        id="marketplace-search"
        name="q"
        type="search"
        placeholder="Buscar productos o comerciantes..."
        className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm text-brand-navy outline-none placeholder:text-slate-400 sm:text-base"
      />
      <button
        type="submit"
        className="min-h-11 shrink-0 rounded-xl bg-brand-blue px-4 text-sm font-bold text-white transition-colors hover:bg-brand-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy sm:px-6"
      >
        Buscar
      </button>
    </form>
  );
}
