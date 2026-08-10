"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthFeedback } from "@/components/atoms/auth-feedback";
import { AuthSubmitButton } from "@/components/atoms/auth-submit-button";
import { Logo } from "@/components/atoms/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { organizerLoginAction } from "@/server/auth/auth-actions";
import { initialAuthActionState } from "@/server/auth/auth.types";

export function LoginCard() {
  const [state, formAction] = useActionState(organizerLoginAction, initialAuthActionState);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Link href="/" aria-label="Voltar ao site" className="mb-5 w-fit">
          <Logo />
        </Link>
        <CardTitle>
          <h1 className="font-heading text-3xl font-bold uppercase">Área do organizador</h1>
        </CardTitle>
        <CardDescription>
          Entre para publicar e administrar os eventos da sua organização.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} aria-label="Login do organizador">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="organizer-email">E-mail</FieldLabel>
              <Input id="organizer-email" name="email" type="email" autoComplete="email" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="organizer-password">Senha</FieldLabel>
              <Input
                id="organizer-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>
            <AuthFeedback state={state} />
            <AuthSubmitButton idleLabel="Entrar" pendingLabel="Entrando..." />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col items-start gap-3 border-t text-sm">
        <Link href="/admin/esqueci-senha" className="font-semibold text-primary underline underline-offset-4">
          Esqueci minha senha
        </Link>
        <p>
          Quer publicar eventos?{" "}
          <Link href="/admin/cadastro" className="font-semibold text-primary underline underline-offset-4">
            Cadastre sua organização
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
