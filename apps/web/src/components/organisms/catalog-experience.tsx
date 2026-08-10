"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircleIcon, SearchXIcon } from "lucide-react";

import { EventLineup } from "@/components/organisms/event-lineup";
import { LandingHero } from "@/components/organisms/landing-hero";
import { OrganizerBanner } from "@/components/organisms/organizer-banner";
import { PublicFooter } from "@/components/organisms/public-footer";
import { PublicHeader } from "@/components/organisms/public-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CatalogResponse } from "@/features/catalog/catalog.types";

export function CatalogExperience() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadCatalog = useCallback(async (nextQuery: string, signal?: AbortSignal) => {
    setIsLoading(true);
    setError(false);

    try {
      setCatalog(await requestCatalog(nextQuery, signal));
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        return;
      }
      setError(true);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    requestCatalog("", controller.signal)
      .then(setCatalog)
      .catch((requestError: unknown) => {
        if (!(requestError instanceof DOMException && requestError.name === "AbortError")) {
          setError(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  function handleSearch(nextQuery: string) {
    const normalizedQuery = nextQuery.trim();
    setQuery(normalizedQuery);
    void loadCatalog(normalizedQuery);
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader isLoading={isLoading} query={query} onSearch={handleSearch} />
      <main aria-busy={isLoading}>
        {isLoading && !catalog ? <CatalogLoading /> : null}
        {!isLoading && error ? (
          <CatalogMessage
            icon={AlertCircleIcon}
            title="Não foi possível carregar a agenda"
            description="Tente novamente. Seus dados de busca continuam aqui."
            action={<Button onClick={() => void loadCatalog(query)}>Tentar novamente</Button>}
          />
        ) : null}
        {!isLoading && !error && catalog?.highlights.length ? (
          <>
            <LandingHero key={catalog.meta.query} events={catalog.highlights} />
            {query ? (
              <div className="border-b bg-card">
                <p className="mx-auto max-w-7xl px-5 py-4 text-sm text-muted-foreground lg:px-8">
                  {catalog.meta.total} {catalog.meta.total === 1 ? "resultado" : "resultados"} para <strong className="text-foreground">“{catalog.meta.query}”</strong>
                </p>
              </div>
            ) : null}
            <EventLineup sections={catalog.sections} />
          </>
        ) : null}
        {!isLoading && !error && catalog && !catalog.highlights.length ? (
          <CatalogMessage
            icon={SearchXIcon}
            title="Nenhum evento encontrado"
            description={`Não encontramos resultados para “${catalog.meta.query}”. Tente outra cidade, atração ou categoria.`}
            action={<Button variant="outline" onClick={() => handleSearch("")}>Limpar busca</Button>}
          />
        ) : null}
        <OrganizerBanner />
      </main>
      <PublicFooter />
    </div>
  );
}

async function requestCatalog(nextQuery: string, signal?: AbortSignal) {
  const search = nextQuery ? `?query=${encodeURIComponent(nextQuery)}` : "";
  const response = await fetch(`/api/catalog${search}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error("Catalog request failed");
  }

  return (await response.json()) as CatalogResponse;
}

function CatalogLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-12 lg:px-8" aria-label="Carregando eventos">
      <Skeleton className="h-[24rem] w-full rounded-2xl" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-80 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

interface CatalogMessageProps {
  icon: typeof AlertCircleIcon;
  title: string;
  description: string;
  action: React.ReactNode;
}

function CatalogMessage({ icon: Icon, title, description, action }: CatalogMessageProps) {
  return (
    <section className="mx-auto flex min-h-[28rem] max-w-7xl flex-col items-center justify-center gap-4 px-5 py-16 text-center lg:px-8" role="status">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-primary">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div className="max-w-lg">
        <h1 className="font-heading text-4xl font-bold uppercase">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action}
    </section>
  );
}
