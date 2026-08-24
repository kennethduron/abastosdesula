import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  MessageCircle,
  PackageSearch,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { MarketplaceSearch } from "@/components/forms/marketplace-search";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { BenefitCard } from "@/components/marketplace/benefit-card";
import { CategoryCard } from "@/components/marketplace/category-card";
import { MerchantCard } from "@/components/marketplace/merchant-card";
import { ProductCard } from "@/components/marketplace/product-card";
import { Reveal } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { siteConfig } from "@/config/site";
import {
  demoAnnouncements,
  demoMerchants,
  demoProducts,
  heroSlides,
  homeBenefits,
  homeCategories,
} from "@/data/home-data";

export default function HomePage() {
  return (
    <main id="contenido-principal" className="min-w-0 flex-1 overflow-clip">
      <section
        id="inicio"
        data-testid="hero-background"
        data-hero-background
        className="relative isolate flex overflow-hidden bg-brand-navy py-12 pb-32 sm:py-16 sm:pb-32 md:min-h-[600px] md:py-16 md:pb-28 lg:min-h-[660px] lg:py-20"
      >
        <HeroCarousel slides={heroSlides} />

        <Container className="pointer-events-none relative z-20 flex w-full items-center">
          <div className="pointer-events-auto max-w-2xl">
            <div className="hero-intro hero-intro-1 mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-brand-navy/40 px-3 py-1.5 text-xs font-bold text-brand-green-light shadow-lg backdrop-blur-md">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Mercado mayorista conectado
            </div>

            <h1 className="hero-intro hero-intro-2 text-[clamp(2.45rem,7vw,4.7rem)] leading-[0.98] font-extrabold tracking-[-0.055em] text-white">
              Productos frescos,
              <span className="mt-2 block text-brand-green-light">
                comerciantes de confianza
              </span>
            </h1>

            <p className="hero-intro hero-intro-3 mt-6 max-w-xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
              Encuentra frutas, verduras, granos, lácteos y otros productos
              disponibles en la Central de Abastos de Sula.
            </p>

            <div className="hero-intro hero-intro-4 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/productos"
                prefetch={false}
                className="button-primary"
              >
                Explorar productos
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/comerciantes"
                prefetch={false}
                className="button-secondary"
              >
                Ver comerciantes
              </Link>
            </div>

            <div className="hero-intro hero-intro-5 mt-8 max-w-xl">
              <MarketplaceSearch />
            </div>

            <div className="hero-intro hero-intro-6 mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/85 sm:text-sm">
              {[
                "Catálogo organizado",
                "Contacto directo",
                "Cotizaciones ágiles",
              ].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <CheckCircle2
                    className="size-4 text-brand-green-light"
                    aria-hidden="true"
                  />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section
        aria-label="Beneficios de la plataforma"
        className="border-y border-border bg-white py-6"
      >
        <Container>
          <RevealGroup
            data-testid="benefits"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
            stagger={60}
          >
            {homeBenefits.map((benefit) => (
              <BenefitCard key={benefit.title} benefit={benefit} />
            ))}
          </RevealGroup>
        </Container>
      </section>

      <section
        data-testid="categories-section"
        className="bg-white py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Encuentra lo que buscas"
              title="Explora por categoría"
              description="Navega por los principales grupos de productos y descubre opciones para tu hogar o negocio."
            />
          </Reveal>
          <RevealGroup
            className="mt-9 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-5"
            stagger={60}
          >
            {homeCategories.map((category) => (
              <CategoryCard key={category.name} category={category} />
            ))}
          </RevealGroup>
        </Container>
      </section>

      <section
        data-testid="merchants-section"
        className="bg-brand-surface py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <Reveal variant="fade-left">
              <SectionHeading
                eyebrow="Comerciantes de la Central"
                title="Comerciantes destacados"
                description="Conoce sus especialidades, revisa su oferta y encuentra el proveedor adecuado para cada compra."
              />
            </Reveal>
            <Reveal delay={80}>
              <Link
                href="/comerciantes"
                prefetch={false}
                className="text-link shrink-0"
              >
                Ver todos
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>
          <RevealGroup
            className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
            variant="scale-soft"
          >
            {demoMerchants.map((merchant) => (
              <MerchantCard key={merchant.name} merchant={merchant} />
            ))}
          </RevealGroup>
        </Container>
      </section>

      <section
        data-testid="products-section"
        className="bg-white py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <Reveal>
              <SectionHeading
                eyebrow="Precios de referencia"
                title="Productos de temporada"
                description="Consulta presentaciones, unidades y valores de referencia para planificar mejor tus compras."
              />
            </Reveal>
            <Reveal delay={80}>
              <Link
                href="/productos"
                prefetch={false}
                className="text-link shrink-0"
              >
                Explorar catálogo
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>
          <RevealGroup
            className="mt-9 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-6"
            stagger={55}
          >
            {demoProducts.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </RevealGroup>
        </Container>
      </section>

      <section data-testid="quote-cta" className="bg-brand-navy py-16 sm:py-20">
        <Container className="grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-14">
          <Reveal variant="fade-left">
            <SectionHeading
              eyebrow="Compras para negocios"
              title="¿Compras para tu restaurante, supermercado o negocio?"
              description="Encuentra proveedores y solicita cotizaciones directamente desde la plataforma."
              inverse
            />
          </Reveal>
          <Reveal variant="fade-right" delay={80}>
            <Link
              href="/productos"
              prefetch={false}
              className="button-light w-full lg:w-auto"
            >
              <PackageSearch className="size-5" aria-hidden="true" />
              Solicitar cotización
            </Link>
          </Reveal>
        </Container>
      </section>

      <section className="bg-brand-green-pale py-16 sm:py-20">
        <Container className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <Reveal variant="scale-soft" className="mx-auto">
            <div className="grid size-40 place-items-center rounded-[2.5rem] bg-brand-green text-white shadow-2xl shadow-brand-green/25 lg:size-52">
              <MessageCircle
                className="size-20 lg:size-28"
                strokeWidth={1.35}
                aria-hidden="true"
              />
            </div>
          </Reveal>
          <Reveal variant="fade-right">
            <SectionHeading
              eyebrow="Conversaciones directas"
              title="Habla directamente con los comerciantes"
              description="Consulta disponibilidad, presentaciones y condiciones de compra por un canal directo y sencillo."
            />
            <a
              href={siteConfig.whatsappDemoUrl}
              target="_blank"
              rel="noreferrer"
              className="button-whatsapp mt-7"
            >
              <MessageCircle className="size-5" aria-hidden="true" />
              Consultar por WhatsApp
            </a>
          </Reveal>
        </Container>
      </section>

      <section
        data-testid="news-section"
        className="bg-white py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Contenido informativo"
              title="Noticias y anuncios"
              description="Consejos, novedades y recursos para compradores y comerciantes de la Central de Abastos de Sula."
            />
          </Reveal>
          <RevealGroup className="mt-9 grid gap-5 md:grid-cols-3">
            {demoAnnouncements.map((announcement, index) => (
              <article
                key={announcement.title}
                className="premium-card group flex min-h-72 flex-col rounded-2xl border border-border bg-brand-surface p-6 transition-[transform,border-color,box-shadow] duration-300 sm:p-7"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-white text-brand-blue shadow-sm">
                  {index === 0 ? (
                    <BookOpen className="size-5" aria-hidden="true" />
                  ) : index === 1 ? (
                    <PackageSearch className="size-5" aria-hidden="true" />
                  ) : (
                    <Building2 className="size-5" aria-hidden="true" />
                  )}
                </span>
                <p className="mt-6 text-xs font-extrabold tracking-[0.12em] text-brand-green uppercase">
                  {announcement.eyebrow}
                </p>
                <h3 className="mt-3 text-xl leading-snug font-extrabold tracking-[-0.02em] text-brand-navy">
                  {announcement.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                  {announcement.description}
                </p>
                <Link
                  href={announcement.href}
                  prefetch={false}
                  className="text-link mt-6"
                >
                  Leer más
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </RevealGroup>
        </Container>
      </section>

      <section className="bg-brand-surface pb-16 sm:pb-20 lg:pb-24">
        <Container>
          <Reveal
            variant="scale-soft"
            className="relative overflow-hidden rounded-[2rem] bg-brand-green px-6 py-12 text-center text-white shadow-2xl shadow-brand-green/20 sm:px-10 sm:py-16"
          >
            <div className="absolute -top-24 -right-20 size-64 rounded-full border-[40px] border-white/10" />
            <div className="absolute -bottom-32 -left-20 size-72 rounded-full bg-brand-navy/15" />
            <div className="relative mx-auto max-w-3xl">
              <p className="text-xs font-extrabold tracking-[0.16em] text-white/75 uppercase">
                Compradores y comerciantes
              </p>
              <h2 className="mt-4 text-3xl leading-tight font-extrabold tracking-[-0.04em] sm:text-5xl">
                Todo lo que necesitas, en un solo lugar
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
                Explora productos, conoce proveedores y prepara tus próximas
                cotizaciones desde una experiencia clara y cercana.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/productos"
                  prefetch={false}
                  className="button-light"
                >
                  Explorar productos
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/comerciantes"
                  prefetch={false}
                  className="button-on-green"
                >
                  Conocer comerciantes
                </Link>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
