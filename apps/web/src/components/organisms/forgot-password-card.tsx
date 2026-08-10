"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthFeedback } from "@/components/atoms/auth-feedback";
import { AuthSubmitButton } from "@/components/atoms/auth-submit-button";
import { Logo } from "@/components/atoms/logo";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { forgotPasswordAction } from "@/server/auth/auth-actions";
import { initialAuthActionState } from "@/server/auth/auth.types";

export function ForgotPasswordCard({ admin = false }: { admin?: boolean }) {
  const [state, formAction] = useActionState(forgotPasswordAction, initialAuthActionState);
  const loginPath = admin ? "/admin/login" : "/login";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Link href="/" aria-label="Voltar ao site" className="mb-5 w-fit"><Logo /></Link>
        <CardTitle><h1 className="font-heading text-3xl font-bold uppercase">Recupere sua senha</h1></CardTitle>
        <CardDescription>Enviaremos um link de uso único se a conta existir.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} aria-label="Recuperação de senha">
          <FieldGroup>
            <Field><FieldLabel htmlFor={admin ? "admin-recovery-email" : "recovery-email"}>E-mail</FieldLabel><Input id={admin ? "admin-recovery-email" : "recovery-email"} name="email" type="email" autoComplete="email" required /></Field>
            <AuthFeedback state={state} />
            <AuthSubmitButton idleLabel="Enviar instruções" pendingLabel="Enviando..." />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="border-t text-sm"><Link href={loginPath} className="font-semibold text-primary underline underline-offset-4">Voltar para entrar</Link></CardFooter>
    </Card>
  );
}
