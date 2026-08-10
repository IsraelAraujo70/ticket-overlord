const steps = [
  {
    title: "Encontre",
    description: "Explore a programação e escolha o evento que combina com você.",
  },
  {
    title: "Reserve",
    description: "Confirme a quantidade e acompanhe as condições antes de pagar.",
  },
  {
    title: "Entre",
    description: "Apresente o QR Code ou o código manual na portaria do evento.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-20 bg-ticket-mist">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="flex flex-col gap-4">
            <p className="font-mono text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Do evento à entrada
            </p>
            <h2 className="font-heading text-5xl leading-none font-bold uppercase md:text-6xl">
              Um ingresso. Três passos.
            </h2>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex min-h-56 flex-col justify-between rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
                <span className="font-mono text-sm font-semibold text-primary">
                  0{index + 1}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="font-heading text-3xl font-bold uppercase">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
