import "server-only";

import type { SearchSuggestion } from "@/features/search/search.types";
import { backendRequest } from "@/server/backend-client";

/** Returns bounded public autocomplete suggestions from the indexed catalog. */
export function getSearchSuggestions(
  query: string,
  limit = 8,
): Promise<SearchSuggestion[]> {
  const params = new URLSearchParams({
    q: query.trim().slice(0, 100),
    limit: String(Math.min(20, Math.max(1, limit))),
  });
  return backendRequest<SearchSuggestion[]>(
    `/search/suggestions?${params.toString()}`,
  );
}
