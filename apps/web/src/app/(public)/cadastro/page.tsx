import { BuyerAuthCard } from "@/components/organisms/buyer-auth-card";
import { AuthTemplate } from "@/components/templates/auth-template";

export default function RegisterPage() {
  return (
    <AuthTemplate>
      <BuyerAuthCard mode="register" />
    </AuthTemplate>
  );
}
