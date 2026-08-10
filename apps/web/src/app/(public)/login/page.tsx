import { BuyerAuthCard } from "@/components/organisms/buyer-auth-card";
import { AuthTemplate } from "@/components/templates/auth-template";

export default function LoginPage() {
  return (
    <AuthTemplate>
      <BuyerAuthCard mode="login" />
    </AuthTemplate>
  );
}
