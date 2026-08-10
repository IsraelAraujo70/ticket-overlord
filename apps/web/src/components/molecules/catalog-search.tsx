import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CatalogSearchProps {
  defaultValue?: string;
  isLoading?: boolean;
}

export function CatalogSearch({
  defaultValue = "",
  isLoading = false,
}: CatalogSearchProps) {
  return (
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
        key={defaultValue}
        name="q"
        defaultValue={defaultValue}
        placeholder="Pesquise por evento, cidade ou categoria"
        className="h-11 border-0 bg-transparent text-ticket-ink shadow-none focus-visible:ring-0"
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
  );
}
