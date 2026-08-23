"use client";

import type { ComponentProps } from "react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function ScrollHeader({
  children,
  className,
  ...props
}: ComponentProps<"header">) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      data-scrolled={scrolled ? "true" : "false"}
      className={cn("public-header", className)}
      {...props}
    >
      {children}
    </header>
  );
}
