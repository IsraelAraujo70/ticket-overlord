"use client";

import Link from "next/link";
import { RefreshCwIcon, ServerCrashIcon } from "lucide-react";
import { Logo } from "@/components/atoms/logo";
import { Button } from "@/components/ui/button";

export default function CheckoutError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ticket-ink px-5 py-12 text-ticket-paper">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <Link href="/" aria-label="Voltar ao início" className="inline-flex">
          <Logo inverted />
        </Link>
        <ServerCrashIcon className="mx-auto mt-8 size-12 text-ticket-coral" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-4xl font-bold uppercase">
          Checkout indisponível
        </h1>
        <p className="mt-3 text-sm leading-6 text-ticket-paper/65">
          Não foi possível consultar seu hold agora. Tente novamente em instantes.
        </p>
        <Button type="button" size="lg" className="mt-6 w-full" onClick={reset}>
          <RefreshCwIcon aria-hidden="true" />
          Tentar novamente
        </Button>
      </section>
    </main>
  );
}
