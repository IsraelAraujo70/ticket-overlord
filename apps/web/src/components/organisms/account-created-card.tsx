"use client";

import { CheckCircle2Icon, MailIcon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { AuthFeedback } from "@/components/atoms/auth-feedback";
import { AuthSubmitButton } from "@/components/atoms/auth-submit-button";
import { Logo } from "@/components/atoms/logo";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resendConfirmationAction } from "@/server/auth/auth-actions";
import { initialAuthActionState } from "@/server/auth/auth.types";

export function AccountCreatedCard({ admin = false }: { admin?: boolean }) {
  const [resend, resendAction] = useActionState(
    resendConfirmationAction,
    initialAuthActionState,
  );
  const loginPath = admin ? "/admin/login" : "/login";

  return (
    <Card className="w-full max-w-md overflow-hidden border-ticket-ink/10 shadow-2xl shadow-ticket-ink/10">
      <CardHeader>
        <Link href="/" aria-label="Voltar ao início" className="w-fit">
          <Logo />
        </Link>
      </CardHeader>
      <CardContent className="space-y-6">
        <section
          className="relative overflow-hidden rounded-xl bg-primary px-6 py-5 text-primary-foreground"
          aria-labelledby="account-created-title"
        >
          <span
            className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full bg-card"
            aria-hidden="true"
          />
          <span
            className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full bg-card"
            aria-hidden="true"
          />
          <div className="flex items-start justify-between gap-5 border-b border-dashed border-white/35 pb-4">
            <div>
              <p className="font-mono text-xs tracking-[0.16em] text-white/75 uppercase">
                Cadastro concluído
              </p>
              <h1
                id="account-created-title"
                className="mt-2 font-heading text-4xl leading-none font-bold uppercase"
              >
                Sua conta foi criada
              </h1>
            </div>
            <CheckCircle2Icon className="mt-1 size-9 shrink-0" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm leading-6 text-white/90">
            Confirme seu e-mail para poder entrar. O link enviado expira em 24 horas.
          </p>
        </section>

        <div className="flex gap-3 rounded-lg border border-ticket-ink/10 bg-ticket-mist/60 p-4">
          <MailIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold text-ticket-ink">Confira sua caixa de entrada</p>
            <p className="text-sm leading-5 text-muted-foreground">
              Abra a mensagem do Ticket Overlord e use o botão de confirmação antes de fazer login.
            </p>
          </div>
        </div>

        <form action={resendAction} aria-label="Reenviar confirmação">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={admin ? "admin-created-email" : "created-email"}>
                Não encontrou o e-mail?
              </FieldLabel>
              <Input
                id={admin ? "admin-created-email" : "created-email"}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="voce@exemplo.com"
                required
              />
            </Field>
            <AuthFeedback state={resend} />
            <AuthSubmitButton
              idleLabel="Reenviar confirmação"
              pendingLabel="Reenviando..."
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="border-t text-sm">
        Já confirmou?{` `}
        <Link
          href={loginPath}
          className="ml-1 font-semibold text-primary underline underline-offset-4"
        >
          Ir para o login
        </Link>
      </CardFooter>
    </Card>
  );
}
