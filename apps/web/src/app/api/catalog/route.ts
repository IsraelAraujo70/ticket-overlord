import { NextRequest, NextResponse } from "next/server";

import { getCatalog } from "@/server/catalog/get-catalog";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") ?? "";
  const requestedPage = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const catalog = await getCatalog(query, page);

  return NextResponse.json(catalog);
}
