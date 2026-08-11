import { notFound } from "next/navigation";

import { UnderConstruction } from "@/components/organisms/under-construction";

const sections = {
  eventos: "Eventos",
  ingressos: "Ingressos",
  pedidos: "Pedidos",
  portaria: "Portaria",
} as const;

interface AdminSectionPageProps {
  params: Promise<{ section: string }>;
}

export default async function AdminSectionPage({
  params,
}: AdminSectionPageProps) {
  const { section } = await params;
  const title = sections[section as keyof typeof sections];

  if (!title) {
    notFound();
  }

  return <UnderConstruction section={title} />;
}
