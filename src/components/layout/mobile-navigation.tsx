"use client";

import { Menu, MessageCircle, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { siteConfig } from "@/config/site";

import { PublicNavLinks } from "./public-nav-links";

const subscribeToHydration = () => () => undefined;

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        className="grid size-11 place-items-center rounded-xl border border-border bg-white text-brand-navy shadow-sm transition-colors hover:bg-brand-green-pale focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:cursor-wait disabled:opacity-70"
        aria-label={isOpen ? "Cerrar menú principal" : "Abrir menú principal"}
        aria-controls="mobile-menu"
        aria-expanded={isOpen}
        disabled={!isHydrated}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 top-[73px] z-40 bg-brand-navy/35 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
          <nav
            id="mobile-menu"
            aria-label="Navegación móvil"
            className="absolute inset-x-0 top-full z-50 border-t border-border bg-white shadow-2xl"
          >
            <div className="mx-auto grid max-w-7xl gap-1 px-4 py-5 sm:px-6">
              <PublicNavLinks mobile onNavigate={() => setIsOpen(false)} />
              <a
                href={siteConfig.whatsappDemoUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsOpen(false)}
                className="mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-green px-5 font-bold text-white transition-colors hover:bg-brand-green-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
              >
                <MessageCircle className="size-5" aria-hidden="true" />
                Contactar por WhatsApp
              </a>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
