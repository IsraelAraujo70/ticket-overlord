import { ResetPasswordCard } from "@/components/organisms/reset-password-card";
import { AuthTemplate } from "@/components/templates/auth-template";

export default function AdminResetPasswordPage() {
  return <AuthTemplate><ResetPasswordCard admin /></AuthTemplate>;
}
