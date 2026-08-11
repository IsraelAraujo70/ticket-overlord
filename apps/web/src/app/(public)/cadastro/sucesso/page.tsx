import { AccountCreatedCard } from "@/components/organisms/account-created-card";
import { AuthTemplate } from "@/components/templates/auth-template";

export default function CustomerRegistrationSuccessPage() {
  return (
    <AuthTemplate>
      <AccountCreatedCard />
    </AuthTemplate>
  );
}
