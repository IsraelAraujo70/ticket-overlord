import { AccountCreatedCard } from "@/components/organisms/account-created-card";
import { AuthTemplate } from "@/components/templates/auth-template";

export default function OrganizerRegistrationSuccessPage() {
  return (
    <AuthTemplate>
      <AccountCreatedCard admin />
    </AuthTemplate>
  );
}
