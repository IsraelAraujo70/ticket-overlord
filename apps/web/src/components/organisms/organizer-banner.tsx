import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OrganizerBanner() {
  return (
    <section className="relative overflow-hidden bg-ticket-coral text-ticket-coral-foreground">
      <div className="public-grid mx-auto grid max-w-7xl gap-6 px-5 py-12 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
        <div>
          <p className="font-mono text-xs font-semibold tracking-[0.18em] uppercase">
            Para produtores
          </p>
          <h2 className="mt-2 max-w-3xl font-heading text-5xl leading-[0.88] font-bold uppercase md:text-6xl">
            Seu evento merece uma plateia.
          </h2>
        </div>
        <Link
          href="/admin/login"
          className={cn(buttonVariants({ size: "lg" }), "bg-ticket-ink text-white hover:bg-ticket-ink/90")}
        >
          Postar eventos
        </Link>
      </div>
    </section>
  );
}
