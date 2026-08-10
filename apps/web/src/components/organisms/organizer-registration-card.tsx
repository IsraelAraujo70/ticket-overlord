"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AuthFeedback } from "@/components/atoms/auth-feedback";
import { AuthSubmitButton } from "@/components/atoms/auth-submit-button";
import { Logo } from "@/components/atoms/logo";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { organizerRegisterAction } from "@/server/auth/auth-actions";
import { initialAuthActionState } from "@/server/auth/auth.types";

interface AddressFields {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export function OrganizerRegistrationCard() {
  const [state, formAction] = useActionState(organizerRegisterAction, initialAuthActionState);
  const [address, setAddress] = useState<AddressFields>({ street: "", neighborhood: "", city: "", state: "" });
  const [postalCodeMessage, setPostalCodeMessage] = useState("");

  async function lookupPostalCode(value: string) {
    const postalCode = value.replace(/\D/g, "");

    if (postalCode.length !== 8) {
      setPostalCodeMessage("Informe um CEP com oito dígitos.");
      return;
    }

    setPostalCodeMessage("Consultando CEP...");
    try {
      const response = await fetch(`/api/addresses/cep/${postalCode}`);
      const body = (await response.json()) as AddressFields & { message?: string };

      if (!response.ok) {
        setPostalCodeMessage(body.message ?? "Não foi possível consultar o CEP.");
        return;
      }

      setAddress({
        street: body.street,
        neighborhood: body.neighborhood,
        city: body.city,
        state: body.state,
      });
      setPostalCodeMessage("Endereço preenchido pelo CEP.");
    } catch {
      setPostalCodeMessage("Não foi possível consultar o CEP agora.");
    }
  }

  function updateAddress(name: keyof AddressFields, value: string) {
    setAddress((current) => ({ ...current, [name]: value }));
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <Link href="/" aria-label="Voltar ao site" className="mb-5 w-fit"><Logo /></Link>
        <CardTitle><h1 className="font-heading text-4xl font-bold uppercase">Publique seus eventos</h1></CardTitle>
        <CardDescription>Crie a conta da empresa responsável pelos eventos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} aria-label="Cadastro do organizador">
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field><FieldLabel htmlFor="organizer-full-name">Nome do responsável</FieldLabel><Input id="organizer-full-name" name="fullName" autoComplete="name" required /></Field>
              <Field><FieldLabel htmlFor="organization-name">Nome da organização</FieldLabel><Input id="organization-name" name="organizationName" required /></Field>
              <Field><FieldLabel htmlFor="organization-cnpj">CNPJ</FieldLabel><Input id="organization-cnpj" name="cnpj" inputMode="numeric" required /></Field>
              <Field><FieldLabel htmlFor="organization-phone">Telefone</FieldLabel><Input id="organization-phone" name="phone" type="tel" autoComplete="tel" required /></Field>
              <Field><FieldLabel htmlFor="organizer-register-email">E-mail</FieldLabel><Input id="organizer-register-email" name="email" type="email" autoComplete="email" required /></Field>
              <Field><FieldLabel htmlFor="organization-postal-code">CEP</FieldLabel><Input id="organization-postal-code" name="postalCode" autoComplete="postal-code" inputMode="numeric" required onBlur={(event) => void lookupPostalCode(event.currentTarget.value)} /><p className="text-xs text-muted-foreground" role="status">{postalCodeMessage}</p></Field>
              <Field><FieldLabel htmlFor="organization-street">Logradouro</FieldLabel><Input id="organization-street" name="street" autoComplete="address-line1" required value={address.street} onChange={(event) => updateAddress("street", event.target.value)} /></Field>
              <Field><FieldLabel htmlFor="organization-number">Número</FieldLabel><Input id="organization-number" name="number" autoComplete="address-line2" required /></Field>
              <Field><FieldLabel htmlFor="organization-complement">Complemento</FieldLabel><Input id="organization-complement" name="complement" /></Field>
              <Field><FieldLabel htmlFor="organization-neighborhood">Bairro</FieldLabel><Input id="organization-neighborhood" name="neighborhood" required value={address.neighborhood} onChange={(event) => updateAddress("neighborhood", event.target.value)} /></Field>
              <Field><FieldLabel htmlFor="organization-city">Cidade</FieldLabel><Input id="organization-city" name="city" autoComplete="address-level2" required value={address.city} onChange={(event) => updateAddress("city", event.target.value)} /></Field>
              <Field><FieldLabel htmlFor="organization-state">UF</FieldLabel><Input id="organization-state" name="state" autoComplete="address-level1" required maxLength={2} value={address.state} onChange={(event) => updateAddress("state", event.target.value.toUpperCase())} /></Field>
              <Field><FieldLabel htmlFor="organizer-register-password">Senha</FieldLabel><Input id="organizer-register-password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} /><p className="text-xs text-muted-foreground">Use pelo menos 12 caracteres.</p></Field>
              <Field><FieldLabel htmlFor="organizer-password-confirmation">Confirme a senha</FieldLabel><Input id="organizer-password-confirmation" name="passwordConfirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128} /></Field>
            </div>
            <AuthFeedback state={state} />
            <AuthSubmitButton idleLabel="Criar organização" pendingLabel="Criando organização..." />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="border-t text-sm">Já possui uma organização? <Link href="/admin/login" className="ml-1 font-semibold text-primary underline underline-offset-4">Entrar</Link></CardFooter>
    </Card>
  );
}
