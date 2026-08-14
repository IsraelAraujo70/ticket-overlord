"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertCircleIcon, SearchXIcon } from "lucide-react";

import { CatalogEventCard } from "@/components/molecules/catalog-event-card";
import { PublicFooter } from "@/components/organisms/public-footer";
import { PublicHeader } from "@/components/organisms/public-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CatalogResponse } from "@/features/catalog/catalog.types";
import type { AuthUser } from "@/server/auth/auth.types";

export function SearchExperience({
  initialQuery,
  user = null,
}: {
  initialQuery: string;
  user?: AuthUser | null;
}) {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);

  const loadResults = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(false);

    try {
      setCatalog(await requestResults(initialQuery, page, signal));
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
  }, [initialQuery, page]);

  useEffect(() => {
    const controller = new AbortController();
    requestResults(initialQuery, page, controller.signal)
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
  }, [initialQuery, page]);

  const events = catalog?.sections.flatMap((section) => section.events) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader isLoading={isLoading} query={initialQuery} user={user} />
      <main aria-busy={isLoading}>
        <SearchHeading query={initialQuery} total={catalog?.meta.total} />
        {isLoading ? <SearchLoading /> : null}
        {!isLoading && error ? (
          <SearchMessage
            icon={AlertCircleIcon}
            title="Não foi possível buscar eventos"
            description="Tente novamente ou use outro termo de busca."
            action={<Button onClick={() => void loadResults()}>Tentar novamente</Button>}
          />
        ) : null}
        {!isLoading && !error && catalog && events.length > 0 ? (
          <section aria-label="Resultados da busca">
            <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {events.map((event) => (
                  <CatalogEventCard key={event.id} event={event} />
                ))}
              </div>
              <SearchPagination
                page={catalog.meta.page}
                pages={catalog.meta.pages}
                onPageChange={setPage}
              />
            </div>
          </section>
        ) : null}
        {!isLoading && !error && catalog && events.length === 0 ? (
          <SearchMessage
            icon={SearchXIcon}
            title="Nenhum evento encontrado"
            description={`Não encontramos resultados para “${catalog.meta.query}”. Tente outra atração, cidade ou categoria.`}
            action={
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/" />}
              >
                Ver todos os eventos
              </Button>
            }
          />
        ) : null}
      </main>
      <PublicFooter />
    </div>
  );
}

async function requestResults(query: string, page: number, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page) });
  if (query) params.set("query", query);
  const search = `?${params.toString()}`;
  const response = await fetch(`/api/catalog${search}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error("Search request failed");
  }

  return (await response.json()) as CatalogResponse;
}

function SearchPagination({ page, pages, onPageChange }: { page: number; pages: number; onPageChange: (page: number) => void }) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Paginação dos resultados">
      <Button variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</Button>
      <span className="font-mono text-sm">Página {page} de {pages}</span>
      <Button variant="outline" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>Próxima</Button>
    </nav>
  );
}

function SearchHeading({ query, total }: { query: string; total?: number }) {
  const resultLabel = total === 1 ? "1 evento encontrado" : `${total ?? 0} eventos encontrados`;

  return (
    <section className="public-grid border-b bg-card">
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <p className="font-mono text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          Busca no catálogo
        </p>
        <h1 className="mt-3 max-w-5xl font-heading text-5xl leading-[0.88] font-bold uppercase md:text-7xl">
          {query ? <>Resultados para “{query}”</> : "Todos os eventos"}
        </h1>
        {total !== undefined ? (
          <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
            {resultLabel}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function SearchLoading() {
  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8 lg:py-14" aria-label="Buscando eventos">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-80 rounded-xl" />
      ))}
    </div>
  );
}

interface SearchMessageProps {
  icon: typeof AlertCircleIcon;
  title: string;
  description: string;
  action: React.ReactNode;
}

function SearchMessage({ icon: Icon, title, description, action }: SearchMessageProps) {
  return (
    <section className="mx-auto flex min-h-[24rem] max-w-7xl flex-col items-center justify-center gap-4 px-5 py-14 text-center lg:px-8" role="status">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-primary">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div className="max-w-lg">
        <h2 className="font-heading text-4xl font-bold uppercase">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action}
    </section>
  );
}
