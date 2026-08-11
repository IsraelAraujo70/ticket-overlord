"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthFeedback } from "@/components/atoms/auth-feedback";
import { AuthSubmitButton } from "@/components/atoms/auth-submit-button";
import { Logo } from "@/components/atoms/logo";
import { PasswordInput } from "@/components/molecules/password-input";
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
import {
  customerLoginAction,
  customerRegisterAction,
} from "@/server/auth/auth-actions";
import { initialAuthActionState } from "@/server/auth/auth.types";

interface BuyerAuthCardProps {
  mode: "login" | "register";
}

export function BuyerAuthCard({ mode }: BuyerAuthCardProps) {
  const isLogin = mode === "login";
  const [state, formAction] = useActionState(
    isLogin ? customerLoginAction : customerRegisterAction,
    initialAuthActionState,
  );

  return (
    <Card className="w-full max-w-md border-ticket-ink/10 shadow-2xl shadow-ticket-ink/10">
      <CardHeader>
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Voltar ao início">
            <Logo />
          </Link>
        </div>
        <CardTitle>
          <h1 className="font-heading text-4xl leading-none font-bold uppercase">
            {isLogin ? "Entre na sua conta" : "Crie sua conta"}
          </h1>
        </CardTitle>
        <CardDescription>
          {isLogin
            ? "Acesse suas compras e seus ingressos em um só lugar."
            : "Prepare sua conta para comprar e compartilhar ingressos."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} aria-label={isLogin ? "Login do cliente" : "Cadastro do cliente"}>
          <FieldGroup>
            {!isLogin ? (
              <Field>
                <FieldLabel htmlFor="customer-full-name">Nome completo</FieldLabel>
                <Input id="customer-full-name" name="fullName" autoComplete="name" required maxLength={160} />
              </Field>
            ) : null}
            <Field>
              <FieldLabel htmlFor="customer-email">E-mail</FieldLabel>
              <Input id="customer-email" name="email" type="email" autoComplete="email" required maxLength={320} />
            </Field>
            <Field>
              <FieldLabel htmlFor="customer-password">Senha</FieldLabel>
              {isLogin ? (
                <Input
                  id="customer-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={128}
                />
              ) : (
                <PasswordInput
                  id="customer-password"
                  name="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                  showStrength
                />
              )}
            </Field>
            {!isLogin ? (
              <Field>
                <FieldLabel htmlFor="customer-password-confirmation">Confirme a senha</FieldLabel>
                <PasswordInput
                  id="customer-password-confirmation"
                  name="passwordConfirmation"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                />
              </Field>
            ) : null}
            <AuthFeedback state={state} />
            <AuthSubmitButton
              idleLabel={isLogin ? "Entrar" : "Criar conta"}
              pendingLabel={isLogin ? "Entrando..." : "Criando conta..."}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col items-start gap-3 border-t text-sm">
        {isLogin ? (
          <Link href="/esqueci-senha" className="font-semibold text-primary underline underline-offset-4">
            Esqueci minha senha
          </Link>
        ) : null}
        <p>
          {isLogin ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
          <Link href={isLogin ? "/cadastro" : "/login"} className="font-semibold text-primary underline underline-offset-4">
            {isLogin ? "Cadastre-se" : "Entrar"}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
