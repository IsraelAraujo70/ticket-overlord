export type SearchSuggestionKind = "EVENT" | "CATEGORY" | "CITY" | "VENUE";

export interface SearchSuggestion {
  kind: SearchSuggestionKind;
  label: string;
  value: string;
  slug: string | null;
}
