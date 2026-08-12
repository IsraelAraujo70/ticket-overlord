import { GateExperience } from "@/components/organisms/gate-experience";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getGateEvents } from "@/server/tickets/tickets";

export default async function GatePage() {
  const user = await getCurrentUser();
  if (!user || !["ORGANIZER", "ORGANIZER_STAFF"].includes(user.role)) {
    redirect("/admin");
  }
  return <GateExperience events={await getGateEvents()} />;
}
