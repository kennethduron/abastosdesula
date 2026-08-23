"use client";

import { useEffect, useRef, useState } from "react";

import { observeReveal } from "./reveal-observer";

export function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"visible" | "hidden">("visible");

  useEffect(() => {
    const element = ref.current;
    if (
      !element ||
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const bounds = element.getBoundingClientRect();
    if (bounds.top < window.innerHeight && bounds.bottom > 0) return;

    setState("hidden");
    return observeReveal(element, () => setState("visible"));
  }, []);

  return { ref, state };
}
