import { CatalogEventCard } from "@/components/molecules/catalog-event-card";
import type { CatalogSection } from "@/features/catalog/catalog.types";

export function EventLineup({ sections }: { sections: CatalogSection[] }) {
  return (
    <div id="eventos" className="scroll-mt-40 bg-background">
      {sections.map((section, index) => (
        <section key={section.id} className={index > 0 ? "border-t" : undefined}>
          <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
            <div className="mb-7 flex items-end justify-between gap-5">
              <div>
                <p className="font-mono text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                  Seleção Ticket Overlord
                </p>
                <h2 className="mt-2 font-heading text-5xl leading-none font-bold uppercase md:text-6xl">
                  {section.title}
                </h2>
              </div>
              <span className="hidden font-mono text-xs text-muted-foreground uppercase sm:block">
                {section.events.length} {section.events.length === 1 ? "evento" : "eventos"}
              </span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {section.events.map((event) => (
                <CatalogEventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
