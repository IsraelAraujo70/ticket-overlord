import { CatalogExperience } from "@/components/organisms/catalog-experience";
import { getCurrentUser } from "@/server/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();

  return <CatalogExperience user={user} />;
}
