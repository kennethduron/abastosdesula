"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { publicNavigation } from "@/config/site";
import { cn } from "@/lib/utils";

export function PublicNavLinks({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return publicNavigation.map((item) => {
    const active =
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch={item.href === "/" ? undefined : false}
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}
        className={cn(
          "font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand-blue",
          mobile
            ? "rounded-xl px-4 py-3 text-base text-brand-navy hover:bg-brand-green-pale hover:text-brand-green"
            : "rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-brand-green-pale hover:text-brand-green aria-[current=page]:bg-brand-green-pale aria-[current=page]:text-brand-green",
        )}
      >
        {item.label}
      </Link>
    );
  });
}
