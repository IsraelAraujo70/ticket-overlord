import { SearchExperience } from "@/components/organisms/search-experience";
import { getCurrentUser } from "@/server/auth/session";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const [{ q = "" }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const query = q.trim().slice(0, 100);

  return <SearchExperience initialQuery={query} user={user} />;
}
