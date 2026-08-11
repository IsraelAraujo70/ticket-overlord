"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  MapPinIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CatalogEvent } from "@/features/catalog/catalog.types";
import { cn } from "@/lib/utils";

const AUTOPLAY_INTERVAL = 6_000;

export function LandingHero({ events }: { events: CatalogEvent[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const currentIndex = activeIndex % events.length;
  const event = events[currentIndex];

  useEffect(() => {
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    if (events.length <= 1 || isPaused || prefersReducedMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % events.length);
    }, AUTOPLAY_INTERVAL);

    return () => window.clearInterval(timer);
  }, [events.length, isPaused]);

  function showPrevious() {
    setActiveIndex((index) => (index - 1 + events.length) % events.length);
  }

  function showNext() {
    setActiveIndex((index) => (index + 1) % events.length);
  }

  return (
    <section
      className="relative isolate min-h-[31rem] overflow-hidden bg-ticket-ink text-ticket-paper"
      aria-label="Eventos em destaque"
      aria-roledescription="carrossel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(blurEvent) => {
        if (!blurEvent.currentTarget.contains(blurEvent.relatedTarget)) {
          setIsPaused(false);
        }
      }}
    >
      <div
        key={event.id}
        className="animate-in fade-in absolute inset-0 duration-700 motion-reduce:animate-none"
        aria-live={isPaused ? "polite" : "off"}
        aria-atomic="true"
      >
        <Image
          src={event.imageUrl}
          alt={event.imageAlt}
          fill
          unoptimized
          priority={currentIndex === 0}
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,23,0.94)_0%,rgba(7,10,23,0.72)_42%,rgba(7,10,23,0.12)_78%)]" />
        <div className="relative mx-auto flex min-h-[31rem] max-w-7xl items-end px-5 py-14 lg:px-8 lg:py-16">
          <div className="max-w-2xl space-y-5">
            <div className="flex items-center gap-3">
              <Badge className="bg-ticket-coral text-ticket-coral-foreground">
                Em destaque
              </Badge>
              <span className="font-mono text-xs tracking-[0.18em] text-ticket-paper/70 uppercase">
                Agenda 2026
              </span>
            </div>
            <h1 className="font-heading text-[clamp(4rem,10vw,7.5rem)] leading-[0.76] font-bold tracking-[-0.04em] uppercase">
              {event.title}
            </h1>
            <p className="max-w-lg text-base leading-7 text-ticket-paper/80">
              {event.summary}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-white/20 pt-4 text-sm">
              <p className="flex items-center gap-2">
                <CalendarDaysIcon className="size-4 text-ticket-coral" aria-hidden="true" />
                {event.dateLabel}
              </p>
              <p className="flex items-center gap-2">
                <MapPinIcon className="size-4 text-ticket-coral" aria-hidden="true" />
                {event.venue}, {event.city}
              </p>
            </div>
          </div>
        </div>
      </div>

      {events.length > 1 ? (
        <div className="absolute inset-x-0 bottom-4 z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
          <div className="flex gap-2" aria-label="Selecionar evento em destaque">
            {events.map((highlight, index) => (
              <button
                key={highlight.id}
                type="button"
                aria-label={`Exibir ${highlight.title}`}
                aria-current={index === currentIndex ? "true" : undefined}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
                  index === currentIndex
                    ? "w-8 bg-ticket-coral"
                    : "w-4 bg-white/45 hover:bg-white/75",
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Evento anterior"
              onClick={showPrevious}
              className="rounded-full bg-white/90 text-ticket-ink hover:bg-white"
            >
              <ArrowLeftIcon aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Próximo evento"
              onClick={showNext}
              className="rounded-full bg-white/90 text-ticket-ink hover:bg-white"
            >
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
