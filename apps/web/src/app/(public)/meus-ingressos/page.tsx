import { redirect } from "next/navigation";
import { MyTicketsExperience } from "@/components/organisms/my-tickets-experience";
import { getCurrentUser } from "@/server/auth/session";
import { getTickets } from "@/server/tickets/tickets";

export default async function MyTicketsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") redirect(`/login?returnTo=${encodeURIComponent("/meus-ingressos")}`);
  return <MyTicketsExperience user={user} tickets={await getTickets()} />;
}
