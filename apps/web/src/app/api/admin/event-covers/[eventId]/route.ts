import { NextResponse } from "next/server";
import { organizerCoverUrl } from "@/server/events/events";

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await context.params;
    return NextResponse.redirect(await organizerCoverUrl(eventId), 307);
  } catch {
    return NextResponse.json({ message: "Capa não encontrada." }, { status: 404 });
  }
}
