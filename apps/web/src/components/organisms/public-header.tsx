import Link from "next/link";

import { Logo } from "@/components/atoms/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 lg:px-8">
        <Link href="/" aria-label="Ir para o início">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex" aria-label="Navegação principal">
          <a href="#eventos" className="hover:text-primary">
            Eventos
          </a>
          <a href="#como-funciona" className="hover:text-primary">
            Como funciona
          </a>
          <Link href="/admin" className="hover:text-primary">
            Área do organizador
          </Link>
        </nav>
        <a
          href="#eventos"
          className={cn(buttonVariants({ size: "lg" }), "shrink-0")}
        >
          Encontrar evento
        </a>
      </div>
    </header>
  );
}
