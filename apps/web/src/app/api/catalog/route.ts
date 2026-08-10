import { NextRequest, NextResponse } from "next/server";

import { getCatalog } from "@/server/catalog/get-catalog";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") ?? "";
  const catalog = await getCatalog(query);

  return NextResponse.json(catalog);
}
