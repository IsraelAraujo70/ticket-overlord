import { notFound } from "next/navigation";
import { Logo } from "@/components/atoms/logo";
import { TicketPass } from "@/components/organisms/ticket-pass";
import { BackendRequestError } from "@/server/backend-client";
import { getSharedTicket } from "@/server/tickets/tickets";

export default async function SharedTicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ticket = await getSharedTicket(token).catch((error: unknown) => {
    if (error instanceof BackendRequestError && error.status === 404) notFound();
    throw error;
  });
  return <main className="min-h-screen bg-ticket-mist px-5 py-8 sm:py-12"><div className="mx-auto mb-8 flex max-w-5xl justify-center"><Logo /></div><TicketPass ticket={ticket} shared /></main>;
}
