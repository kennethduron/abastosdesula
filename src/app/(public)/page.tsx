import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  MessageCircle,
  PackageSearch,
  ShoppingBasket,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { MarketplaceSearch } from "@/components/forms/marketplace-search";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { BenefitCard } from "@/components/marketplace/benefit-card";
import { CategoryCard } from "@/components/marketplace/category-card";
import { MerchantCard } from "@/components/marketplace/merchant-card";
import { ProductCard } from "@/components/marketplace/product-card";
import { siteConfig } from "@/config/site";
import {
  demoAnnouncements,
  demoMerchants,
  demoProducts,
  homeBenefits,
  homeCategories,
} from "@/data/home-data";

export default function HomePage() {
  return (
    <main id="contenido-principal" className="min-w-0 flex-1 overflow-clip">
      <section
        id="inicio"
        className="relative isolate bg-brand-surface py-12 sm:py-16 lg:py-20"
      >
        <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_15%_20%,var(--brand-green-pale),transparent_55%)]" />
        <Container className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-white px-3 py-1.5 text-xs font-bold text-brand-green shadow-sm">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Mercado digital multicomercio
            </div>
            <h1 className="text-[clamp(2.45rem,7vw,4.7rem)] leading-[0.98] font-extrabold tracking-[-0.055em] text-brand-navy">
              Productos frescos,
              <span className="mt-2 block text-brand-green">
                comerciantes de confianza
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Encuentra frutas, verduras, granos, lácteos y otros productos
              disponibles en la Central de Abastos de Sula.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/productos" className="button-primary">
                Explorar productos
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/comerciantes" className="button-secondary">
                Ver comerciantes
              </Link>
            </div>

            <div className="mt-8 max-w-xl">
              <MarketplaceSearch />
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500 sm:text-sm">
              {[
                "Catálogo organizado",
                "Contacto directo",
                "Cotizaciones ágiles",
              ].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <CheckCircle2
                    className="size-4 text-brand-green"
                    aria-hidden="true"
                  />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
            <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-brand-green-pale sm:-inset-5" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.6rem] bg-brand-green-pale shadow-2xl shadow-brand-navy/18 sm:aspect-[5/4]">
              <Image
                src="/images/home/hero-market.webp"
                alt="Puesto de mercado con frutas y vegetales frescos"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/45 via-transparent to-transparent" />
              <div className="absolute right-4 bottom-4 left-4 flex items-center justify-between gap-3 rounded-2xl border border-white/25 bg-white/92 p-4 shadow-lg backdrop-blur-md sm:right-6 sm:bottom-6 sm:left-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-green text-white">
                    <ShoppingBasket className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-brand-navy sm:text-base">
                      Compra en un solo lugar
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                      Directo con cada comerciante
                    </p>
                  </div>
                </div>
                <span className="hidden rounded-full bg-brand-green-pale px-3 py-1 text-xs font-bold text-brand-green sm:inline-flex">
                  Demo
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section
        aria-label="Beneficios de la plataforma"
        className="border-y border-border bg-white py-6"
      >
        <Container>
          <div
            data-testid="benefits"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            {homeBenefits.map((benefit) => (
              <BenefitCard key={benefit.title} benefit={benefit} />
            ))}
          </div>
        </Container>
      </section>

      <section
        data-testid="categories-section"
        className="bg-white py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <SectionHeading
            eyebrow="Encuentra lo que buscas"
            title="Explora por categoría"
            description="Navega por los principales grupos de productos y descubre opciones para tu hogar o negocio."
          />
          <div className="mt-9 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-5">
            {homeCategories.map((category) => (
              <CategoryCard key={category.name} category={category} />
            ))}
          </div>
        </Container>
      </section>

      <section
        data-testid="merchants-section"
        className="bg-brand-surface py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Directorio multicomercio"
              title="Comerciantes destacados"
              description="Perfiles de demostración que muestran cómo podrás conocer especialidades y contactar proveedores."
            />
            <Link href="/comerciantes" className="text-link shrink-0">
              Ver todos
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {demoMerchants.map((merchant) => (
              <MerchantCard key={merchant.name} merchant={merchant} />
            ))}
          </div>
        </Container>
      </section>

      <section
        data-testid="products-section"
        className="bg-white py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Valores demostrativos"
              title="Productos de temporada"
              description="Una muestra del catálogo que permitirá consultar presentaciones y precios de referencia."
            />
            <Link href="/productos" className="text-link shrink-0">
              Explorar catálogo
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-9 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-6">
            {demoProducts.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        </Container>
      </section>

      <section data-testid="quote-cta" className="bg-brand-navy py-16 sm:py-20">
        <Container className="grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-14">
          <SectionHeading
            eyebrow="Compras para negocios"
            title="¿Compras para tu restaurante, supermercado o negocio?"
            description="Encuentra proveedores y solicita cotizaciones directamente desde la plataforma."
            inverse
          />
          <Link href="/productos" className="button-light w-full lg:w-auto">
            <PackageSearch className="size-5" aria-hidden="true" />
            Solicitar cotización
          </Link>
        </Container>
      </section>

      <section className="bg-brand-green-pale py-16 sm:py-20">
        <Container className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div className="mx-auto grid size-40 place-items-center rounded-[2.5rem] bg-brand-green text-white shadow-2xl shadow-brand-green/25 lg:size-52">
            <MessageCircle
              className="size-20 lg:size-28"
              strokeWidth={1.35}
              aria-hidden="true"
            />
          </div>
          <div>
            <SectionHeading
              eyebrow="Conversaciones directas"
              title="Habla directamente con los comerciantes"
              description="Consulta disponibilidad, presentaciones y opciones de compra mediante un enlace seguro de demostración. No se utiliza ningún número real."
            />
            <a
              href={siteConfig.whatsappDemoUrl}
              target="_blank"
              rel="noreferrer"
              className="button-whatsapp mt-7"
            >
              <MessageCircle className="size-5" aria-hidden="true" />
              Abrir WhatsApp demo
            </a>
          </div>
        </Container>
      </section>

      <section
        data-testid="news-section"
        className="bg-white py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <SectionHeading
            eyebrow="Contenido informativo"
            title="Noticias y anuncios"
            description="Ejemplos de contenido que la institución podrá publicar cuando la plataforma esté operativa."
          />
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {demoAnnouncements.map((announcement, index) => (
              <article
                key={announcement.title}
                className="group flex min-h-72 flex-col rounded-2xl border border-border bg-brand-surface p-6 transition-all hover:-translate-y-1 hover:border-brand-green/30 hover:shadow-xl hover:shadow-brand-navy/8 sm:p-7"
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
                <Link href={announcement.href} className="text-link mt-6">
                  Leer más
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-brand-surface pb-16 sm:pb-20 lg:pb-24">
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] bg-brand-green px-6 py-12 text-center text-white shadow-2xl shadow-brand-green/20 sm:px-10 sm:py-16">
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
                <Link href="/productos" className="button-light">
                  Explorar productos
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href="/comerciantes" className="button-on-green">
                  Conocer comerciantes
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
