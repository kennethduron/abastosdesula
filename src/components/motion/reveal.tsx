"use client";

import type { ComponentProps, CSSProperties } from "react";

import { cn } from "@/lib/utils";

import { useReveal } from "./use-reveal";

export type RevealVariant =
  "fade" | "fade-up" | "fade-left" | "fade-right" | "scale-soft";

interface RevealProps extends ComponentProps<"div"> {
  delay?: number;
  variant?: RevealVariant;
}

export function Reveal({
  children,
  className,
  delay = 0,
  style,
  variant = "fade-up",
  ...props
}: RevealProps) {
  const { ref, state } = useReveal();

  return (
    <div
      ref={ref}
      data-reveal-state={state}
      className={cn("reveal", `reveal-${variant}`, className)}
      style={
        {
          ...style,
          "--reveal-delay": `${delay}ms`,
        } as CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
}
