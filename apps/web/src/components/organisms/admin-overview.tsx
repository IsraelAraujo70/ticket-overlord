import {
  CalendarCheckIcon,
  Clock3Icon,
  TicketCheckIcon,
  UsersIcon,
} from "lucide-react";

import { MetricCard } from "@/components/molecules/metric-card";
import { PageHeader } from "@/components/molecules/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const recentEvents = [
  {
    name: "Frequência urbana",
    date: "22 ago, 19h",
    availability: "420 ingressos",
    status: "Rascunho",
  },
  {
    name: "A cidade que ficou",
    date: "05 set, 20h",
    availability: "180 ingressos",
    status: "Rascunho",
  },
  {
    name: "Quase pontual",
    date: "18 set, 21h",
    availability: "240 ingressos",
    status: "Rascunho",
  },
];

export function AdminOverview() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Administração"
        title="Visão geral"
        description="A estrutura do painel está pronta para receber autenticação, catálogo e criação de eventos nas próximas etapas."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CalendarCheckIcon}
          label="Eventos"
          note="conteúdo demonstrativo"
          value="03"
        />
        <MetricCard
          icon={TicketCheckIcon}
          label="Ingressos"
          note="capacidade cadastrada"
          value="840"
        />
        <MetricCard
          icon={UsersIcon}
          label="Organizadores"
          note="acesso será conectado"
          value="01"
        />
        <MetricCard
          icon={Clock3Icon}
          label="Próximo evento"
          note="Frequência urbana"
          value="12 dias"
        />
      </div>

      <Card id="events">
        <CardHeader>
          <CardTitle>Eventos recentes</CardTitle>
          <CardDescription>
            Prévia estática do gerenciamento que será integrado à API.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">3 rascunhos</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col">
          {recentEvents.map((event, index) => (
            <div key={event.name}>
              {index > 0 ? <Separator /> : null}
              <div className="grid gap-3 py-4 sm:grid-cols-[1.3fr_0.8fr_0.8fr_auto] sm:items-center">
                <div>
                  <p className="font-medium">{event.name}</p>
                  <p className="text-xs text-muted-foreground">{event.date}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {event.availability}
                </p>
                <Badge variant="outline">{event.status}</Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  DEMO
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
