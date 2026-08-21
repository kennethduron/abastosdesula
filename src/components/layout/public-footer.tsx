import { Camera, Globe2, Leaf, MessageCircle } from "lucide-react";
import Link from "next/link";

import { publicNavigation, siteConfig } from "@/config/site";
import { homeCategories } from "@/data/home-data";

import { Brand } from "./brand";
import { Container } from "./container";

export function PublicFooter() {
  return (
    <footer
      data-testid="public-footer"
      className="bg-brand-navy text-slate-300"
    >
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1fr] lg:py-16">
        <div className="max-w-sm">
          <Brand inverse />
          <p className="mt-5 text-sm leading-6 text-slate-300">
            Una plataforma para acercar compradores y comerciantes a través de
            productos, catálogos y cotizaciones claras.
          </p>
          <div
            className="mt-6 flex gap-2"
            aria-label="Redes sociales próximamente"
          >
            {[Globe2, Camera, MessageCircle].map((Icon, index) => (
              <span
                key={index}
                title="Enlace próximamente"
                className="grid size-10 place-items-center rounded-xl border border-white/15 text-slate-300"
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
            ))}
          </div>
        </div>

        <FooterColumn title="Navegación">
          {publicNavigation.map((item) => (
            <Link key={item.href} href={item.href} className="footer-link">
              {item.label}
            </Link>
          ))}
        </FooterColumn>

        <FooterColumn title="Categorías">
          {homeCategories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="footer-link"
            >
              {category.name}
            </Link>
          ))}
        </FooterColumn>

        <div>
          <h3 className="text-sm font-bold text-white">
            Contacto institucional
          </h3>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Los canales oficiales se publicarán cuando sean confirmados por la
            institución.
          </p>
          <a
            href={siteConfig.whatsappDemoUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-lg text-sm font-bold text-brand-green-light hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-green-light"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Abrir WhatsApp demo
          </a>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Central de Abastos de Sula.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5">
              <Leaf
                className="size-3.5 text-brand-green-light"
                aria-hidden="true"
              />
              Fotografías de demostración: Unsplash
            </span>
            <span className="text-slate-300">Desarrollado por Ken Code</span>
          </div>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <div className="mt-4 flex flex-col items-start gap-3 text-sm">
        {children}
      </div>
    </div>
  );
}
