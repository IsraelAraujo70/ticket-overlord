import { LoginCard } from "@/components/organisms/login-card";
import { AuthTemplate } from "@/components/templates/auth-template";

export default function AdminLoginPage() {
  return (
    <AuthTemplate>
      <LoginCard />
    </AuthTemplate>
  );
}
