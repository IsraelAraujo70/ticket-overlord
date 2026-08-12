import { notFound, redirect } from "next/navigation";
import { CheckoutExperience } from "@/components/organisms/checkout-experience";
import { BackendRequestError } from "@/server/backend-client";
import type { Reservation } from "@/features/checkout/checkout.types";
import { getCurrentUser } from "@/server/auth/session";
import { getReservation } from "@/server/checkout/checkout";

export default async function CheckoutPage({ params }: { params: Promise<{ reservationId: string }> }) {
  const { reservationId } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") {
    redirect(`/login?returnTo=${encodeURIComponent(`/checkout/${reservationId}`)}`);
  }

  let reservation: Reservation;
  try {
    reservation = await getReservation(reservationId);
  } catch (error) {
    if (error instanceof BackendRequestError && error.status === 404) notFound();
    throw error;
  }

  return <CheckoutExperience reservation={reservation} />;
}
