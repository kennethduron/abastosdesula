import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { DemoProduct } from "@/types/home";

export function ProductCard({ product }: { product: DemoProduct }) {
  return (
    <article className="premium-card group min-w-0 overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-[transform,border-color,box-shadow] duration-300">
      <Link
        href={product.href}
        prefetch={false}
        className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      >
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          <Image
            src={product.image}
            alt={product.imageAlt}
            fill
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 17vw"
            className="premium-image object-cover transition-transform duration-500"
          />
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2 py-1 text-[0.62rem] font-extrabold tracking-wide text-brand-green uppercase shadow-sm backdrop-blur-sm">
            Precio de referencia
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 text-sm leading-snug font-extrabold text-brand-navy sm:text-base">
              {product.name}
            </h3>
            <ArrowUpRight
              className="mt-0.5 size-4 shrink-0 text-slate-400 transition-colors group-hover:text-brand-blue"
              aria-hidden="true"
            />
          </div>
          <p className="mt-2 text-sm font-bold text-brand-green">
            {product.price}{" "}
            <span className="font-medium text-slate-500">/ {product.unit}</span>
          </p>
        </div>
      </Link>
    </article>
  );
}
