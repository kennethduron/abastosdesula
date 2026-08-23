import { ArrowRight, BadgeCheck, MessageCircle, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { MerchantDirectoryItem } from "@/components/merchants/merchant-directory";

export function MerchantDirectoryCard({
  merchant,
}: {
  merchant: MerchantDirectoryItem;
}) {
  const whatsappMessage = encodeURIComponent(
    `Hola, vi el perfil demo de ${merchant.name} en la plataforma de Central de Abastos de Sula.`,
  );

  return (
    <article
      data-testid="merchant-card"
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand-green/30 hover:shadow-xl hover:shadow-brand-navy/8"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 sm:aspect-[5/3]">
        <Image
          src={merchant.image}
          alt={merchant.imageAlt}
          fill
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
        />
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-brand-green/20 bg-white/94 px-2.5 py-1 text-[0.7rem] font-extrabold text-brand-green shadow-sm backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-brand-green" />
          Disponible · Demo
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-extrabold tracking-[0.16em] text-brand-green uppercase">
              {merchant.categoryNames.join(" · ")}
            </p>
            <h2 className="mt-1.5 text-lg leading-tight font-extrabold tracking-[-0.025em] text-brand-navy">
              {merchant.name}
            </h2>
          </div>
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-green-pale text-brand-green"
            title="Perfil de demostración"
          >
            <BadgeCheck className="size-5" aria-hidden="true" />
          </span>
        </div>

        <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-slate-600">
          {merchant.description}
        </p>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Package className="size-3.5 text-brand-green" aria-hidden="true" />
            Productos destacados
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {merchant.featuredProducts.map((product) => (
              <span
                key={product}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.7rem] font-semibold text-slate-600"
              >
                {product}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Link
            href={`/comerciantes/${merchant.slug}`}
            prefetch={false}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-extrabold text-brand-navy transition-colors hover:border-brand-blue/30 hover:bg-brand-blue/5 hover:text-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            Ver perfil
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
          <a
            href={`https://wa.me/${merchant.whatsappDemo}?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Abrir WhatsApp demo de ${merchant.name}`}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-green px-3 text-sm font-extrabold text-white transition-colors hover:bg-brand-green-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            WhatsApp demo
          </a>
        </div>
      </div>
    </article>
  );
}
