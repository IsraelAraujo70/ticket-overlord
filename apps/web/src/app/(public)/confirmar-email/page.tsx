import { EmailConfirmationCard } from "@/components/organisms/email-confirmation-card";
import { AuthTemplate } from "@/components/templates/auth-template";

export default function ConfirmEmailPage() {
  return <AuthTemplate><EmailConfirmationCard /></AuthTemplate>;
}
