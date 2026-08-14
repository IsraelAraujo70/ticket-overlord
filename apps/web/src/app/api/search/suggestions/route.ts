import { NextRequest, NextResponse } from "next/server";

import { getSearchSuggestions } from "@/server/search/search";

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "")
    .trim()
    .slice(0, 100);
  if (query.length < 2) return NextResponse.json([]);

  return NextResponse.json(await getSearchSuggestions(query));
}
