"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { HeroSlide } from "@/types/home";

const AUTOPLAY_INTERVAL = 6_000;
const SWIPE_THRESHOLD = 44;
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

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
    const element = carouselRef.current;
    const hero = element?.closest<HTMLElement>("[data-hero-background]");
    if (!hero) return;

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (event.pointerType === "touch") {
        pointerStartX.current = event.clientX;
      }
    };
    const handlePointerEnd = (event: globalThis.PointerEvent) => {
      if (event.pointerType !== "touch" || pointerStartX.current === null) {
        return;
      }

      const distance = event.clientX - pointerStartX.current;
      pointerStartX.current = null;
      if (Math.abs(distance) < SWIPE_THRESHOLD) return;

      setCurrentSlide(
        (current) =>
          (current + (distance < 0 ? 1 : -1) + slides.length) % slides.length,
      );
      setManuallyPaused(true);
    };
    const handlePointerCancel = () => {
      pointerStartX.current = null;
    };
    const handleMouseEnter = () => setHovering(true);
    const handleMouseLeave = () => setHovering(false);
    const handleFocusIn = () => setFocusWithin(true);
    const handleFocusOut = (event: globalThis.FocusEvent) => {
      if (!hero.contains(event.relatedTarget as Node | null)) {
        setFocusWithin(false);
      }
    };

    hero.addEventListener("mouseenter", handleMouseEnter);
    hero.addEventListener("mouseleave", handleMouseLeave);
    hero.addEventListener("focusin", handleFocusIn);
    hero.addEventListener("focusout", handleFocusOut);
    hero.addEventListener("pointerdown", handlePointerDown);
    hero.addEventListener("pointerup", handlePointerEnd);
    hero.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      hero.removeEventListener("mouseenter", handleMouseEnter);
      hero.removeEventListener("mouseleave", handleMouseLeave);
      hero.removeEventListener("focusin", handleFocusIn);
      hero.removeEventListener("focusout", handleFocusOut);
      hero.removeEventListener("pointerdown", handlePointerDown);
      hero.removeEventListener("pointerup", handlePointerEnd);
      hero.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [slides.length]);

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

  return (
    <div
      ref={carouselRef}
      data-testid="hero-carousel"
      data-background-carousel="true"
      role="region"
      aria-label="Destacados de la plataforma"
      aria-roledescription="carrusel"
      aria-live={autoplayActive ? "off" : "polite"}
      className="hero-carousel pointer-events-none absolute inset-0 z-0 overflow-hidden bg-brand-navy"
    >
      <div className="absolute inset-0 touch-pan-y overflow-hidden">
        {slides.map((slide, index) => {
          const active = currentSlide === index;

          return (
            <article
              key={slide.image}
              data-testid={`hero-slide-${index + 1}`}
              data-slide-index={index + 1}
              data-active={active ? "true" : "false"}
              aria-hidden={!active}
              aria-label={`${index + 1} de ${slides.length}: ${slide.title}`}
              aria-roledescription="diapositiva"
              role="group"
              className="hero-carousel-slide absolute inset-0"
            >
              <Image
                src={slide.image}
                alt=""
                fill
                preload={index === 0}
                loading={index === 0 ? undefined : "lazy"}
                sizes="100vw"
                className={`hero-carousel-image hero-carousel-image-${index + 1} object-cover`}
              />
            </article>
          );
        })}
      </div>

      <div className="hero-background-overlay absolute inset-0 z-10" />
      <div className="hero-background-glow absolute inset-0 z-20" />

      <div className="hero-carousel-controls pointer-events-auto absolute z-30 flex items-center gap-0.5 rounded-2xl border border-white/15 bg-brand-navy/38 p-1 shadow-xl shadow-brand-navy/15 backdrop-blur-md sm:gap-1">
        <button
          type="button"
          className="carousel-control"
          aria-label="Mostrar diapositiva anterior"
          onClick={() => selectSlide(currentSlide - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <div className="flex items-center" aria-label="Seleccionar diapositiva">
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
    </div>
  );
}
