import { SearchExperience } from "@/components/organisms/search-experience";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 100);

  return <SearchExperience initialQuery={query} />;
}
