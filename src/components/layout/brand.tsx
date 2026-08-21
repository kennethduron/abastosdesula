import { Leaf } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface BrandProps {
  compact?: boolean;
  inverse?: boolean;
}

export function Brand({ compact = false, inverse = false }: BrandProps) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name}, ir al inicio`}
      className="group inline-flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue"
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl bg-brand-green text-white shadow-sm transition-transform group-hover:-rotate-3",
          compact && "size-9",
        )}
        aria-hidden="true"
      >
        <Leaf className="size-5" strokeWidth={2.4} />
      </span>
      <span
        className={cn(
          "min-w-0 text-[0.93rem] leading-[1.05] font-extrabold tracking-[-0.025em] text-brand-navy sm:text-base",
          inverse && "text-white",
        )}
      >
        <span className="block">Central de Abastos</span>
        <span
          className={cn(
            "block text-brand-green",
            inverse && "text-brand-green-light",
          )}
        >
          de Sula
        </span>
      </span>
    </Link>
  );
}
