"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  CalendarDaysIcon,
  MapPinIcon,
  SearchIcon,
  TagIcon,
  TicketIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  SearchSuggestion,
  SearchSuggestionKind,
} from "@/features/search/search.types";
import { cn } from "@/lib/utils";

interface CatalogSearchProps {
  defaultValue?: string;
  isLoading?: boolean;
}

const kindLabels: Record<SearchSuggestionKind, string> = {
  EVENT: "Evento",
  CATEGORY: "Categoria",
  CITY: "Cidade",
  VENUE: "Local",
};

export function CatalogSearch({
  defaultValue = "",
  isLoading = false,
}: CatalogSearchProps) {
  const listboxId = useId();
  const requestId = useRef(0);
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) return;

    const controller = new AbortController();
    const currentRequest = ++requestId.current;
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(normalized)}`,
          {
            signal: controller.signal,
          },
        );
        if (!response.ok)
          throw new Error(`Suggestions failed with ${response.status}.`);
        const results = (await response.json()) as SearchSuggestion[];
        if (currentRequest !== requestId.current) return;
        setSuggestions(results);
        setActiveIndex(-1);
        setIsOpen(results.length > 0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        if (currentRequest !== requestId.current) return;
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 200);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  function selectSuggestion(suggestion: SearchSuggestion) {
    setQuery(suggestion.value);
    setIsOpen(false);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (!isOpen || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      );
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const suggestion = suggestions[activeIndex]!;
      const link = document.getElementById(`${listboxId}-${activeIndex}`);
      selectSuggestion(suggestion);
      if (link instanceof HTMLAnchorElement) link.click();
    }
  }

  return (
    <div className="relative w-full">
      <form
        action="/search"
        method="get"
        className="flex w-full overflow-hidden rounded-lg bg-white p-1 shadow-lg shadow-ticket-ink/10"
        role="search"
      >
        <label htmlFor="catalog-query" className="sr-only">
          Pesquisar eventos
        </label>
        <Input
          id="catalog-query"
          name="q"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => setIsOpen(suggestions.length > 0)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 100)}
          onKeyDown={handleKeyDown}
          minLength={2}
          placeholder="Pesquise por evento, cidade ou categoria"
          className="h-11 border-0 bg-transparent text-ticket-ink shadow-none focus-visible:ring-0"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
          }
        />
        <Button
          type="submit"
          aria-label="Pesquisar"
          className="h-11 shrink-0 px-4 sm:px-6"
          disabled={isLoading}
        >
          <span className="hidden sm:inline">Pesquisar</span>
          <SearchIcon className="size-4" aria-hidden="true" />
        </Button>
      </form>

      {isOpen ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-80 overflow-y-auto rounded-lg border border-ticket-line bg-white p-1 text-ticket-ink shadow-xl"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.kind}-${suggestion.slug ?? suggestion.value}`}
              role="none"
            >
              <a
                id={`${listboxId}-${index}`}
                href={suggestionHref(suggestion)}
                role="option"
                aria-selected={activeIndex === index}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-ticket-surface",
                  activeIndex === index && "bg-ticket-surface",
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <SuggestionIcon kind={suggestion.kind} />
                <span className="min-w-0 flex-1 truncate">
                  {suggestion.label}
                </span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-ticket-muted">
                  {kindLabels[suggestion.kind]}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Maps a catalog suggestion to its public destination. */
export function suggestionHref(suggestion: SearchSuggestion): string {
  if (suggestion.kind === "EVENT" && suggestion.slug) {
    return `/eventos/${encodeURIComponent(suggestion.slug)}`;
  }
  return `/search?q=${encodeURIComponent(suggestion.value)}`;
}

function SuggestionIcon({ kind }: { kind: SearchSuggestionKind }) {
  const className = "size-4 shrink-0 text-ticket-blue";
  if (kind === "EVENT")
    return <TicketIcon className={className} aria-hidden="true" />;
  if (kind === "CATEGORY")
    return <TagIcon className={className} aria-hidden="true" />;
  if (kind === "CITY")
    return <MapPinIcon className={className} aria-hidden="true" />;
  return <CalendarDaysIcon className={className} aria-hidden="true" />;
}
