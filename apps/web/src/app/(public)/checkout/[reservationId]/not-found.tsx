import Link from "next/link";
import { ClockAlertIcon } from "lucide-react";
import { Logo } from "@/components/atoms/logo";

export default function CheckoutNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ticket-ink px-5 py-12 text-ticket-paper">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <Link href="/" aria-label="Voltar ao início" className="inline-flex">
          <Logo inverted />
        </Link>
        <ClockAlertIcon className="mx-auto mt-8 size-12 text-ticket-coral" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-4xl font-bold uppercase">
          Ingresso esgotado
        </h1>
        <p className="mt-3 text-sm leading-6 text-ticket-paper/65">
          Outra pessoa conseguiu assegurar esse ingresso primeiro.
        </p>
        <Link
          href="/"
          className="mt-6 flex h-9 w-full items-center justify-center rounded-lg bg-ticket-paper px-3 text-sm font-semibold text-ticket-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/40"
        >
          Escolher ingressos novamente
        </Link>
      </section>
    </main>
  );
}
