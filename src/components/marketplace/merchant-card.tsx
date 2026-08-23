import { ArrowRight, BadgeCheck, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import type { DemoMerchant } from "@/types/home";

export function MerchantCard({ merchant }: { merchant: DemoMerchant }) {
  return (
    <article className="premium-card group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-[transform,border-color,box-shadow] duration-300">
      <div className="relative aspect-[16/9] overflow-hidden bg-brand-green-pale">
        <Image
          src={merchant.image}
          alt={merchant.imageAlt}
          fill
          sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 25vw"
          className="premium-image object-cover transition-transform duration-500"
        />
        <span className="absolute top-3 left-3 rounded-full bg-brand-navy/85 px-2.5 py-1 text-[0.65rem] font-extrabold tracking-wide text-white uppercase backdrop-blur-sm">
          Comercio demo
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base leading-snug font-extrabold text-brand-navy">
              {merchant.name}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{merchant.category}</p>
          </div>
          {merchant.verified && (
            <span
              title="Perfil verificado en la demostración"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-green-pale text-brand-green"
            >
              <BadgeCheck className="size-4" aria-hidden="true" />
              <span className="sr-only">Verificado</span>
            </span>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
          <Link
            href={merchant.href}
            prefetch={false}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-bold text-brand-navy transition-colors hover:border-brand-blue hover:text-brand-blue focus-visible:outline-2 focus-visible:outline-brand-blue"
          >
            Ver perfil
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <a
            href={siteConfig.whatsappDemoUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Contactar a ${merchant.name} por WhatsApp, enlace demo`}
            className="grid size-10 place-items-center rounded-xl bg-brand-green text-white transition-colors hover:bg-brand-green-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
