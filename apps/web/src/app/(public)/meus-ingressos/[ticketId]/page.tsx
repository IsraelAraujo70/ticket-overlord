import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { TicketPass } from "@/components/organisms/ticket-pass";
import { BackendRequestError } from "@/server/backend-client";
import { getCurrentUser } from "@/server/auth/session";
import { getTicket } from "@/server/tickets/tickets";

export default async function TicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const user = await getCurrentUser();
  const { ticketId } = await params;
  if (!user || user.role !== "CUSTOMER") redirect(`/login?returnTo=${encodeURIComponent(`/meus-ingressos/${ticketId}`)}`);
  const ticket = await getTicket(ticketId).catch((error: unknown) => {
    if (error instanceof BackendRequestError && error.status === 404) notFound();
    throw error;
  });
  return <main className="min-h-screen bg-ticket-mist px-5 py-8 sm:py-12"><div className="mx-auto mb-6 max-w-5xl"><Link href="/meus-ingressos" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeftIcon className="size-4" />Meus ingressos</Link></div><TicketPass ticket={ticket} /></main>;
}
