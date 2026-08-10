import { DramaIcon, Mic2Icon, Music2Icon } from "lucide-react";

import { EventTicketCard } from "@/components/molecules/event-ticket-card";

const events = [
  {
    category: "Música",
    date: "AGO 2026",
    day: "22",
    description:
      "Três palcos, artistas independentes e uma programação que atravessa a madrugada.",
    icon: Music2Icon,
    location: "Complexo Barra Funda, São Paulo",
    price: "R$ 90",
    title: "Frequência urbana",
  },
  {
    category: "Teatro",
    date: "SET 2026",
    day: "05",
    description:
      "Uma montagem contemporânea sobre memória, cidade e os encontros que mudam rotas.",
    icon: DramaIcon,
    location: "Teatro Oficina, São Paulo",
    price: "R$ 55",
    title: "A cidade que ficou",
  },
  {
    category: "Comédia",
    date: "SET 2026",
    day: "18",
    description:
      "Quatro nomes da nova comédia brasileira dividem o palco em uma única sessão.",
    icon: Mic2Icon,
    location: "Teatro das Artes, São Paulo",
    price: "R$ 48",
    title: "Quase pontual",
  },
];

export function EventLineup() {
  return (
    <section id="eventos" className="scroll-mt-20 border-b bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-5 md:grid-cols-[1fr_0.75fr] md:items-end">
          <div>
            <p className="font-mono text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Próximos eventos
            </p>
            <h2 className="mt-3 font-heading text-5xl leading-none font-bold uppercase md:text-7xl">
              Escolha o seu lugar.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground md:justify-self-end">
            Esta programação é demonstrativa. A integração com catálogo, busca e
            inventário será conectada nas próximas etapas do produto.
          </p>
        </div>
        <div className="flex flex-col gap-5">
          {events.map((event) => (
            <EventTicketCard key={event.title} {...event} />
          ))}
        </div>
      </div>
    </section>
  );
}
