"use client";

import type { ComponentProps, CSSProperties } from "react";

import { cn } from "@/lib/utils";

import type { RevealVariant } from "./reveal";
import { useReveal } from "./use-reveal";

interface RevealGroupProps extends ComponentProps<"div"> {
  delay?: number;
  stagger?: number;
  variant?: RevealVariant;
}

export function RevealGroup({
  children,
  className,
  delay = 0,
  stagger = 65,
  style,
  variant = "fade-up",
  ...props
}: RevealGroupProps) {
  const { ref, state } = useReveal();

  return (
    <div
      ref={ref}
      data-reveal-state={state}
      className={cn("reveal-group", `reveal-group-${variant}`, className)}
      style={
        {
          ...style,
          "--reveal-delay": `${delay}ms`,
          "--reveal-stagger": `${stagger}ms`,
        } as CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
}
