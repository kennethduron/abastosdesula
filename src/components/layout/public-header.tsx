import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";

import { Brand } from "./brand";
import { Container } from "./container";
import { MobileNavigation } from "./mobile-navigation";
import { PublicNavLinks } from "./public-nav-links";
import { ScrollHeader } from "./scroll-header";

export function PublicHeader() {
  return (
    <ScrollHeader
      data-testid="public-header"
      className="sticky top-0 z-50 border-b border-border/80 bg-white/95 backdrop-blur-md"
    >
      <a
        href="#contenido-principal"
        className="sr-only rounded-lg bg-brand-navy px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60]"
      >
        Saltar al contenido principal
      </a>
      <Container className="relative flex h-[72px] items-center justify-between gap-3">
        <Brand compact />

        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-1 xl:flex"
        >
          <PublicNavLinks />
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={siteConfig.whatsappDemoUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir WhatsApp demo"
            className="inline-flex size-11 items-center justify-center gap-2 rounded-xl bg-brand-green text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-green-dark hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue sm:w-auto sm:px-4"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <MobileNavigation />
        </div>
      </Container>
    </ScrollHeader>
  );
}
