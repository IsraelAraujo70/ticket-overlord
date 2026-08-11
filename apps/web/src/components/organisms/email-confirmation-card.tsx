"use client";

import Link from "next/link";
import { CheckCircle2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { AuthFeedback } from "@/components/atoms/auth-feedback";
import { AuthSubmitButton } from "@/components/atoms/auth-submit-button";
import { Logo } from "@/components/atoms/logo";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { confirmEmailAction, resendConfirmationAction } from "@/server/auth/auth-actions";
import {
  initialAuthActionState,
  type EmailConfirmationActionState,
} from "@/server/auth/auth.types";

export function EmailConfirmationCard({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
  const confirmationStarted = useRef(false);
  const [confirmation, setConfirmation] = useState<EmailConfirmationActionState>({
    status: "idle",
    message: "Confirmando seu e-mail...",
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [resend, resendAction] = useActionState(resendConfirmationAction, initialAuthActionState);
  const loginPath = admin ? "/admin/login" : "/login";

  useEffect(() => {
    if (confirmationStarted.current) {
      return;
    }
    confirmationStarted.current = true;

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

    void confirmEmailAction(token, admin ? "admin" : "customer").then((result) => {
      setConfirmation(result);

      if (result.status === "success" && result.redirectTo) {
        window.history.replaceState(null, "", window.location.pathname);
        setCountdown(3);
      }
    });
  }, [admin]);

  useEffect(() => {
    if (countdown === null || !confirmation.redirectTo) {
      return;
    }

    if (countdown === 0) {
      router.replace(confirmation.redirectTo);
      return;
    }

    const timeout = window.setTimeout(() => {
      setCountdown((current) => (current === null ? null : current - 1));
    }, 1_000);

    return () => window.clearTimeout(timeout);
  }, [confirmation.redirectTo, countdown, router]);

  const confirmed = confirmation.status === "success";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Link href="/" aria-label="Voltar ao site" className="mb-5 w-fit"><Logo /></Link>
        <CardTitle>
          <h1 className="font-heading text-3xl font-bold uppercase">
            {confirmed ? "Seu e-mail foi confirmado" : "Confirme seu e-mail"}
          </h1>
        </CardTitle>
        <CardDescription>
          {confirmed
            ? "Sua conta está pronta para usar."
            : "O link pode ser utilizado uma única vez."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {confirmed ? (
          <div className="flex flex-col items-start gap-4" role="status" aria-live="polite">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CheckCircle2Icon aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-primary">{confirmation.message}</p>
              <p className="text-sm text-muted-foreground">
                {countdown === 0
                  ? "Abrindo sua conta..."
                  : `Redirecionando para sua conta em ${countdown ?? 3}.`}
              </p>
            </div>
          </div>
        ) : (
          <>
            <AuthFeedback state={confirmation} />
            <form action={resendAction} aria-label="Reenviar confirmação">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor={admin ? "admin-confirmation-email" : "confirmation-email"}>
                    Não recebeu? Informe seu e-mail
                  </FieldLabel>
                  <Input
                    id={admin ? "admin-confirmation-email" : "confirmation-email"}
                    name="email"
                    type="email"
                    required
                  />
                </Field>
                <AuthFeedback state={resend} />
                <AuthSubmitButton idleLabel="Reenviar confirmação" pendingLabel="Reenviando..." />
              </FieldGroup>
            </form>
          </>
        )}
      </CardContent>
      <CardFooter className="border-t text-sm">
        <Link
          href={confirmed ? (confirmation.redirectTo ?? loginPath) : loginPath}
          className="font-semibold text-primary underline underline-offset-4"
        >
          {confirmed ? "Ir agora" : "Ir para o login"}
        </Link>
      </CardFooter>
    </Card>
  );
}
