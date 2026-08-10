"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { AuthFeedback } from "@/components/atoms/auth-feedback";
import { Logo } from "@/components/atoms/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resetPasswordAction } from "@/server/auth/auth-actions";
import type { AuthActionState } from "@/server/auth/auth.types";

export function ResetPasswordCard({ admin = false }: { admin?: boolean }) {
  const [token, setToken] = useState("");
  const [state, setState] = useState<AuthActionState>({ status: "idle" });
  const [pending, setPending] = useState(false);
  const loginPath = admin ? "/admin/login" : "/login";

  useEffect(() => {
    const currentToken = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    void Promise.resolve().then(() => {
      setToken(currentToken);
      if (!currentToken) {
        setState({
          status: "error",
          message: "O link de recuperação não contém um token.",
        });
      }
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setState(
      await resetPasswordAction(
        token,
        String(data.get("password") ?? ""),
        String(data.get("passwordConfirmation") ?? ""),
      ),
    );
    setPending(false);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Link href="/" aria-label="Voltar ao site" className="mb-5 w-fit"><Logo /></Link>
        <CardTitle><h1 className="font-heading text-3xl font-bold uppercase">Defina uma nova senha</h1></CardTitle>
        <CardDescription>A redefinição encerrará as sessões existentes.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void submit(event)} aria-label="Redefinir senha">
          <FieldGroup>
            <Field><FieldLabel htmlFor={admin ? "admin-new-password" : "new-password"}>Nova senha</FieldLabel><Input id={admin ? "admin-new-password" : "new-password"} name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></Field>
            <Field><FieldLabel htmlFor={admin ? "admin-new-password-confirmation" : "new-password-confirmation"}>Confirme a nova senha</FieldLabel><Input id={admin ? "admin-new-password-confirmation" : "new-password-confirmation"} name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></Field>
            <AuthFeedback state={state} />
            <Button type="submit" disabled={pending || !token} className="w-full">{pending ? "Redefinindo..." : "Redefinir senha"}</Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="border-t text-sm"><Link href={loginPath} className="font-semibold text-primary underline underline-offset-4">Voltar para entrar</Link></CardFooter>
    </Card>
  );
}
