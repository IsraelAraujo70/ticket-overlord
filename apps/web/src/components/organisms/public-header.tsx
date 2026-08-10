import Link from "next/link";

import { Logo } from "@/components/atoms/logo";
import { CatalogSearch } from "@/components/molecules/catalog-search";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PublicHeaderProps {
  isLoading: boolean;
  query: string;
  onSearch: (query: string) => void;
}

export function PublicHeader({ isLoading, query, onSearch }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg shadow-ticket-ink/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <Link href="/" aria-label="Ir para o início">
          <Logo inverted />
        </Link>
        <nav className="flex items-center gap-2" aria-label="Conta do cliente">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost" }), "text-primary-foreground hover:bg-white/10 hover:text-primary-foreground")}
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className={cn(buttonVariants({ variant: "secondary" }), "hidden sm:inline-flex")}
          >
            Cadastre-se
          </Link>
        </nav>
      </div>
      <div className="border-t border-white/15 bg-primary px-5 py-3 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <CatalogSearch defaultValue={query} isLoading={isLoading} onSearch={onSearch} />
        </div>
      </div>
    </header>
  );
}
