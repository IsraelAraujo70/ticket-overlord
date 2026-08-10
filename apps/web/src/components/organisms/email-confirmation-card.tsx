"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { AuthFeedback } from "@/components/atoms/auth-feedback";
import { AuthSubmitButton } from "@/components/atoms/auth-submit-button";
import { Logo } from "@/components/atoms/logo";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { confirmEmailAction, resendConfirmationAction } from "@/server/auth/auth-actions";
import { initialAuthActionState, type AuthActionState } from "@/server/auth/auth.types";

export function EmailConfirmationCard({ admin = false }: { admin?: boolean }) {
  const [confirmation, setConfirmation] = useState<AuthActionState>({ status: "idle", message: "Confirmando seu e-mail..." });
  const [resend, resendAction] = useActionState(resendConfirmationAction, initialAuthActionState);
  const loginPath = admin ? "/admin/login" : "/login";

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");

    if (!token) {
      void Promise.resolve().then(() =>
        setConfirmation({
          status: "error",
          message: "O link de confirmação não contém um token.",
        }),
      );
      return;
    }

    void confirmEmailAction(token).then(setConfirmation);
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Link href="/" aria-label="Voltar ao site" className="mb-5 w-fit"><Logo /></Link>
        <CardTitle><h1 className="font-heading text-3xl font-bold uppercase">Confirme seu e-mail</h1></CardTitle>
        <CardDescription>O link pode ser utilizado uma única vez.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AuthFeedback state={confirmation} />
        <form action={resendAction} aria-label="Reenviar confirmação">
          <FieldGroup>
            <Field><FieldLabel htmlFor={admin ? "admin-confirmation-email" : "confirmation-email"}>Não recebeu? Informe seu e-mail</FieldLabel><Input id={admin ? "admin-confirmation-email" : "confirmation-email"} name="email" type="email" required /></Field>
            <AuthFeedback state={resend} />
            <AuthSubmitButton idleLabel="Reenviar confirmação" pendingLabel="Reenviando..." />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="border-t text-sm"><Link href={loginPath} className="font-semibold text-primary underline underline-offset-4">Ir para o login</Link></CardFooter>
    </Card>
  );
}
