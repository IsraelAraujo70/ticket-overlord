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
        <p className="max-w-sm text-sm leading-6 font-medium md:text-right">
          O canal para novos organizadores será disponibilizado após a conclusão da plataforma.
        </p>
      </div>
    </section>
  );
}
