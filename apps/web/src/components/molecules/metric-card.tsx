import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  note: string;
  value: string;
}

export function MetricCard({ icon: Icon, label, note, value }: MetricCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-mono text-2xl font-semibold">{value}</CardTitle>
        <CardAction>
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Icon aria-hidden="true" />
          </span>
        </CardAction>
        <p className="text-xs text-muted-foreground">{note}</p>
      </CardHeader>
    </Card>
  );
}
