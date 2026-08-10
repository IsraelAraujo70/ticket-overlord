import Link from "next/link";

import { Logo } from "@/components/atoms/logo";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

export function LoginCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="mb-5 flex items-center justify-between gap-4">
          <Logo />
          <Badge variant="secondary">Próxima etapa</Badge>
        </div>
        <CardTitle>
          <h1 className="font-heading text-3xl font-bold uppercase">
            Área do organizador
          </h1>
        </CardTitle>
        <CardDescription>
          A tela está pronta para receber a autenticação real. Nenhuma credencial
          é enviada ou armazenada nesta versão.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form aria-label="Login demonstrativo">
          <FieldGroup>
            <Field data-disabled>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="organizador@exemplo.com"
                autoComplete="email"
                disabled
              />
            </Field>
            <Field data-disabled>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled
              />
            </Field>
            <Button type="submit" disabled className="w-full">
              Entrar
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Autenticação ainda não implementada.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Voltar ao site
        </Link>
      </CardFooter>
    </Card>
  );
}
