import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { HomeCategory } from "@/types/home";

export function CategoryCard({ category }: { category: HomeCategory }) {
  return (
    <article className="premium-card group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-[transform,border-color,box-shadow] duration-300">
      <Link
        href={category.href}
        prefetch={false}
        className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        aria-label={`Explorar ${category.name}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-brand-green-pale">
          <Image
            src={category.image}
            alt={`Categoría ${category.name}`}
            fill
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 20vw"
            className="premium-image object-cover transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/25 to-transparent" />
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <h3 className="font-extrabold text-brand-navy">{category.name}</h3>
            <p className="mt-1 truncate text-xs text-slate-500">
              {category.description}
            </p>
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-green-pale text-brand-green transition-colors group-hover:bg-brand-green group-hover:text-white">
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}
