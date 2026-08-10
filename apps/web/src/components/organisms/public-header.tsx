import Link from "next/link";

import { Logo } from "@/components/atoms/logo";
import { CatalogSearch } from "@/components/molecules/catalog-search";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PublicHeaderProps {
  isLoading: boolean;
  query: string;
}

export function PublicHeader({ isLoading, query }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg shadow-ticket-ink/10">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-5 py-3 md:grid-cols-[auto_minmax(18rem,1fr)_auto] lg:gap-x-8 lg:px-8">
        <Link href="/" aria-label="Ir para o início">
          <Logo inverted />
        </Link>
        <div className="col-span-2 row-start-2 w-full md:col-span-1 md:col-start-2 md:row-start-1 md:mx-auto md:max-w-3xl">
          <CatalogSearch defaultValue={query} isLoading={isLoading} />
        </div>
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
    </header>
  );
}
