"use client";

import Image from "next/image";
import { useState } from "react";

import type { CommercialSpaceImage } from "@/domain";
import { cn } from "@/lib/utils";

export function SpaceGallery({ images }: { images: CommercialSpaceImage[] }) {
  const [active, setActive] = useState(0);
  return (
    <div data-testid="space-gallery" className="min-w-0">
      <div className="relative hidden aspect-[16/10] overflow-hidden rounded-3xl bg-slate-100 shadow-sm md:block">
        <Image
          src={images[active].src}
          alt={images[active].alt}
          fill
          priority
          sizes="(max-width: 1200px) 65vw, 760px"
          className="object-cover"
        />
      </div>
      <div className="mt-3 hidden grid-cols-3 gap-3 md:grid">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Ver fotografía ${index + 1}`}
            aria-pressed={index === active}
            className={cn(
              "relative aspect-[4/3] overflow-hidden rounded-2xl border-2 bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
              index === active ? "border-brand-green" : "border-transparent",
            )}
          >
            <Image
              src={image.src}
              alt=""
              fill
              sizes="220px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:hidden">
        {images.map((image, index) => (
          <figure
            key={`${image.src}-${index}`}
            className="relative aspect-[4/3] w-[88vw] max-w-[420px] shrink-0 snap-center overflow-hidden rounded-2xl bg-slate-100"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority={index === 0}
              sizes="88vw"
              className="object-cover"
            />
          </figure>
        ))}
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-slate-500 md:hidden">
        Desliza para ver más fotografías
      </p>
    </div>
  );
}
