import { ArrowRight, Check, MapPin, Ruler } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { CommercialSpace } from "@/domain";

const availabilityLabels = {
  available: "Disponible para consulta",
  reserved: "Reservado",
  unavailable: "No disponible",
} as const;

export function CommercialSpaceCard({ space }: { space: CommercialSpace }) {
  return (
    <article
      data-testid="commercial-space-card"
      className="premium-card group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <Link
        href={`/locales/${space.slug}`}
        prefetch={false}
        className="relative block aspect-[4/3] overflow-hidden bg-slate-100"
      >
        <Image
          src={space.coverImage.src}
          alt={space.coverImage.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
          className="premium-image object-cover transition-transform duration-500"
        />
        <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold text-brand-green-dark shadow-sm backdrop-blur">
          {availabilityLabels[space.availabilityStatus]}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-xs font-extrabold tracking-[0.12em] text-brand-blue uppercase">
          {space.type}
        </p>
        <h3 className="mt-2 text-xl font-black tracking-tight text-brand-navy">
          {space.title}
        </h3>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Ruler className="size-4 text-brand-green" />
            {space.approximateArea}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 text-brand-green" />
            {space.locationLabel}
          </span>
        </div>
        <ul className="mt-5 space-y-2 text-sm text-slate-600">
          {space.features.slice(0, 3).map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-brand-green" />
              {feature}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-5">
          <div>
            <p className="text-xs font-semibold text-slate-500">Condiciones</p>
            <p className="mt-0.5 font-black text-brand-navy">
              Consultar condiciones
            </p>
          </div>
          <Link
            href={`/locales/${space.slug}`}
            prefetch={false}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-blue px-4 text-sm font-bold text-white hover:bg-brand-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            Ver espacio <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
