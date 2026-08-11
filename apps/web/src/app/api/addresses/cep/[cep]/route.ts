import { NextResponse } from "next/server";
import { backendBaseUrl } from "@/server/backend-client";

export async function GET(
  _request: Request,
  context: { params: Promise<{ cep: string }> },
) {
  const { cep } = await context.params;

  try {
    const response = await fetch(
      `${backendBaseUrl()}/addresses/cep/${encodeURIComponent(cep)}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );
    const body = (await response.json()) as unknown;
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        code: "API_UNAVAILABLE",
        message: "Não foi possível consultar o CEP agora.",
      },
      { status: 503 },
    );
  }
}
