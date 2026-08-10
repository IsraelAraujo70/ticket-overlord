import { ForgotPasswordCard } from "@/components/organisms/forgot-password-card";
import { AuthTemplate } from "@/components/templates/auth-template";

export default function AdminForgotPasswordPage() {
  return <AuthTemplate><ForgotPasswordCard admin /></AuthTemplate>;
}
