import { BadgeCheck, Clock3, Leaf, MessageCircle } from "lucide-react";

import type { HomeBenefit } from "@/types/home";

const benefitIcons = {
  fresh: Leaf,
  verified: BadgeCheck,
  quote: Clock3,
  contact: MessageCircle,
} as const;

export function BenefitCard({ benefit }: { benefit: HomeBenefit }) {
  const Icon = benefitIcons[benefit.icon];

  return (
    <article className="premium-card flex min-w-0 items-start gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm transition-[transform,border-color,box-shadow] duration-300 sm:p-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-green-pale text-brand-green">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-brand-navy sm:text-base">
          {benefit.title}
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
          {benefit.description}
        </p>
      </div>
    </article>
  );
}
