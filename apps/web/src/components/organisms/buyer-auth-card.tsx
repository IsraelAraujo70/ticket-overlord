import Link from "next/link";

import { Logo } from "@/components/atoms/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface BuyerAuthCardProps {
  mode: "login" | "register";
}

export function BuyerAuthCard({ mode }: BuyerAuthCardProps) {
  const isLogin = mode === "login";

  return (
    <Card className="w-full max-w-md border-ticket-ink/10 shadow-2xl shadow-ticket-ink/10">
      <CardHeader>
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Voltar ao início"><Logo /></Link>
          <Badge variant="secondary">Em breve</Badge>
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
        <form aria-label={isLogin ? "Login do cliente" : "Cadastro do cliente"}>
          <FieldGroup>
            {!isLogin ? (
              <Field data-disabled>
                <FieldLabel htmlFor="name">Nome completo</FieldLabel>
                <Input id="name" name="name" autoComplete="name" placeholder="Seu nome" disabled />
              </Field>
            ) : null}
            <Field data-disabled>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" disabled />
            </Field>
            <Field data-disabled>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Input id="password" name="password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} placeholder="••••••••" disabled />
            </Field>
            <Button type="submit" disabled className="w-full">
              {isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col items-start gap-3 border-t text-sm">
        <p className="text-muted-foreground">Autenticação ainda não conectada.</p>
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
