"use client";

import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ShoppingBasket,
  Store,
  Warehouse,
} from "lucide-react";
import Image from "next/image";
import {
  type FocusEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import type { HeroSlide } from "@/types/home";

const AUTOPLAY_INTERVAL = 6_000;
const SWIPE_THRESHOLD = 44;
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

const slideIcons = {
  market: ShoppingBasket,
  specialists: Store,
  business: Warehouse,
} as const;

function subscribeToReducedMotion(callback: () => void) {
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [focusWithin, setFocusWithin] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [inViewport, setInViewport] = useState(true);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );

  const autoplayActive =
    !reducedMotion &&
    !manuallyPaused &&
    !focusWithin &&
    !hovering &&
    inViewport &&
    pageVisible &&
    slides.length > 1;

  useEffect(() => {
    const element = carouselRef.current;
    if (!element || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInViewport(entry.isIntersecting),
      { threshold: 0.3 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (!autoplayActive) return;

    const timer = window.setInterval(() => {
      setCurrentSlide((current) => (current + 1) % slides.length);
    }, AUTOPLAY_INTERVAL);

    return () => window.clearInterval(timer);
  }, [autoplayActive, slides.length]);

  function selectSlide(index: number) {
    setCurrentSlide((index + slides.length) % slides.length);
    setManuallyPaused(true);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setFocusWithin(false);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") pointerStartX.current = event.clientX;
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "touch" || pointerStartX.current === null) return;

    const distance = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(distance) < SWIPE_THRESHOLD) return;

    selectSlide(currentSlide + (distance < 0 ? 1 : -1));
  }

  return (
    <div
      ref={carouselRef}
      data-testid="hero-carousel"
      role="region"
      aria-label="Destacados de la plataforma"
      aria-roledescription="carrusel"
      className="hero-carousel relative mx-auto w-full max-w-2xl lg:mx-0"
      onBlur={handleBlur}
      onFocus={() => setFocusWithin(true)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onPointerCancel={() => {
        pointerStartX.current = null;
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-brand-green-pale sm:-inset-5" />
      <div
        className="relative aspect-[4/3] touch-pan-y overflow-hidden rounded-[1.6rem] bg-brand-navy shadow-2xl shadow-brand-navy/18 sm:aspect-[5/4]"
        aria-live={autoplayActive ? "off" : "polite"}
      >
        {slides.map((slide, index) => {
          const Icon = slideIcons[slide.icon];
          const active = currentSlide === index;

          return (
            <article
              key={slide.image}
              data-testid={`hero-slide-${index + 1}`}
              data-active={active ? "true" : "false"}
              aria-hidden={!active}
              aria-label={`${index + 1} de ${slides.length}: ${slide.title}`}
              aria-roledescription="diapositiva"
              className="hero-carousel-slide absolute inset-0"
            >
              <Image
                src={slide.image}
                alt={slide.imageAlt}
                fill
                preload={index === 0}
                loading={index === 0 ? undefined : "lazy"}
                sizes="(max-width: 1023px) calc(100vw - 2rem), (max-width: 1279px) 50vw, 584px"
                className="hero-carousel-image object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/60 via-brand-navy/5 to-transparent" />
              <div className="absolute right-4 bottom-4 left-4 flex items-center gap-3 rounded-2xl border border-white/25 bg-white/92 p-3.5 shadow-lg backdrop-blur-md sm:right-6 sm:bottom-6 sm:left-6 sm:p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-green text-white">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-brand-navy sm:text-base">
                    {slide.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm">
                    {slide.description}
                  </p>
                </div>
              </div>
            </article>
          );
        })}

        <div className="absolute top-3 right-3 z-10 flex gap-2 sm:top-4 sm:right-4">
          <button
            type="button"
            className="carousel-control"
            aria-label="Mostrar diapositiva anterior"
            onClick={() => selectSlide(currentSlide - 1)}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="carousel-control"
            aria-label={
              reducedMotion
                ? "La reproducción automática está desactivada por movimiento reducido"
                : manuallyPaused
                  ? "Reanudar reproducción automática"
                  : "Pausar reproducción automática"
            }
            disabled={reducedMotion}
            onClick={() => setManuallyPaused((paused) => !paused)}
          >
            {manuallyPaused || reducedMotion ? (
              <Play className="size-3.5" aria-hidden="true" />
            ) : (
              <Pause className="size-3.5" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="carousel-control"
            aria-label="Mostrar diapositiva siguiente"
            onClick={() => selectSlide(currentSlide + 1)}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div
          className="absolute bottom-[5.8rem] left-1/2 z-10 flex -translate-x-1/2 items-center"
          aria-label="Seleccionar diapositiva"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Mostrar diapositiva ${index + 1}: ${slide.title}`}
              aria-current={currentSlide === index ? "true" : undefined}
              className="carousel-dot-control"
              onClick={() => selectSlide(index)}
            >
              <span className="carousel-dot" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
