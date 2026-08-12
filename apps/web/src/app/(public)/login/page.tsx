import { BuyerAuthCard } from "@/components/organisms/buyer-auth-card";
import { AuthTemplate } from "@/components/templates/auth-template";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string | string[] }> }) {
  const params = await searchParams;
  const returnTo = typeof params.returnTo === "string" ? params.returnTo : undefined;
  return (
    <AuthTemplate>
      <BuyerAuthCard mode="login" returnTo={returnTo} />
    </AuthTemplate>
  );
}
