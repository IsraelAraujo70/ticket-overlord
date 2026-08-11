"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { AuthFeedback } from "@/components/atoms/auth-feedback";
import { AuthSubmitButton } from "@/components/atoms/auth-submit-button";
import { Logo } from "@/components/atoms/logo";
import { BrazilianPhoneInput } from "@/components/molecules/brazilian-phone-input";
import { CnpjInput } from "@/components/molecules/cnpj-input";
import { PasswordInput } from "@/components/molecules/password-input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRAZILIAN_STATES } from "@/lib/brazilian-states";
import {
  brazilianPhoneSchema,
  cnpjSchema,
  firstFieldErrors,
  organizerRegistrationFieldsSchema,
} from "@/lib/validation/organizer-registration";
import { organizerRegisterAction } from "@/server/auth/auth-actions";
import { initialOrganizerRegistrationActionState } from "@/server/auth/auth.types";

interface AddressFields {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export function OrganizerRegistrationCard() {
  const [state, formAction] = useActionState(
    organizerRegisterAction,
    initialOrganizerRegistrationActionState,
  );
  const [address, setAddress] = useState<AddressFields>({ street: "", neighborhood: "", city: "", state: "" });
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"cnpj" | "phone" | "state", string>>
  >({});
  const [postalCodeMessage, setPostalCodeMessage] = useState("");

  const errors = { ...state.fieldErrors, ...fieldErrors };

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

  function validateCnpj() {
    const result = cnpjSchema.safeParse(cnpj);
    setFieldErrors((current) => ({
      ...current,
      cnpj: result.success ? undefined : result.error.issues[0]?.message,
    }));
  }

  function validatePhone() {
    const result = brazilianPhoneSchema.safeParse(phone);
    setFieldErrors((current) => ({
      ...current,
      phone: result.success ? undefined : result.error.issues[0]?.message,
    }));
  }

  function validateRegistrationFields(event: FormEvent<HTMLFormElement>) {
    const result = organizerRegistrationFieldsSchema.safeParse({
      cnpj,
      phone,
      state: address.state,
    });

    if (!result.success) {
      event.preventDefault();
      setFieldErrors(firstFieldErrors(result.error));
    }
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <Link href="/" aria-label="Voltar ao site" className="mb-5 w-fit"><Logo /></Link>
        <CardTitle><h1 className="font-heading text-4xl font-bold uppercase">Publique seus eventos</h1></CardTitle>
        <CardDescription>Crie a conta da empresa responsável pelos eventos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          aria-label="Cadastro do organizador"
          onSubmit={validateRegistrationFields}
        >
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
              <Field><FieldLabel htmlFor="organizer-full-name">Nome do responsável</FieldLabel><Input id="organizer-full-name" name="fullName" autoComplete="name" required /></Field>
              <Field><FieldLabel htmlFor="organization-name">Nome da organização</FieldLabel><Input id="organization-name" name="organizationName" required /></Field>
              <Field data-invalid={Boolean(errors.cnpj)}>
                <FieldLabel htmlFor="organization-cnpj">CNPJ</FieldLabel>
                <CnpjInput
                  id="organization-cnpj"
                  name="cnpj"
                  required
                  value={cnpj}
                  aria-invalid={Boolean(errors.cnpj)}
                  aria-describedby={errors.cnpj ? "organization-cnpj-error" : undefined}
                  onBlur={validateCnpj}
                  onChange={(event) => {
                    setCnpj(event.currentTarget.value);
                    setFieldErrors((current) => ({ ...current, cnpj: undefined }));
                  }}
                />
                <FieldError id="organization-cnpj-error">{errors.cnpj}</FieldError>
              </Field>
              <Field data-invalid={Boolean(errors.phone)}>
                <FieldLabel htmlFor="organization-phone">Telefone</FieldLabel>
                <BrazilianPhoneInput
                  id="organization-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "organization-phone-error" : undefined}
                  onBlur={validatePhone}
                  onValueChange={(value) => {
                    setPhone(value);
                    setFieldErrors((current) => ({ ...current, phone: undefined }));
                  }}
                />
                <FieldError id="organization-phone-error">{errors.phone}</FieldError>
              </Field>
              <Field><FieldLabel htmlFor="organizer-register-email">E-mail</FieldLabel><Input id="organizer-register-email" name="email" type="email" autoComplete="email" required /></Field>
              <Field><FieldLabel htmlFor="organization-postal-code">CEP</FieldLabel><Input id="organization-postal-code" name="postalCode" autoComplete="postal-code" inputMode="numeric" required onBlur={(event) => void lookupPostalCode(event.currentTarget.value)} /><p className="text-xs text-muted-foreground" role="status">{postalCodeMessage}</p></Field>
              <Field><FieldLabel htmlFor="organization-street">Logradouro</FieldLabel><Input id="organization-street" name="street" autoComplete="address-line1" required value={address.street} onChange={(event) => updateAddress("street", event.target.value)} /></Field>
              <Field><FieldLabel htmlFor="organization-number">Número</FieldLabel><Input id="organization-number" name="number" autoComplete="address-line2" required /></Field>
              <Field><FieldLabel htmlFor="organization-complement">Complemento</FieldLabel><Input id="organization-complement" name="complement" /></Field>
              <Field><FieldLabel htmlFor="organization-neighborhood">Bairro</FieldLabel><Input id="organization-neighborhood" name="neighborhood" required value={address.neighborhood} onChange={(event) => updateAddress("neighborhood", event.target.value)} /></Field>
              <Field><FieldLabel htmlFor="organization-city">Cidade</FieldLabel><Input id="organization-city" name="city" autoComplete="address-level2" required value={address.city} onChange={(event) => updateAddress("city", event.target.value)} /></Field>
              <Field data-invalid={Boolean(errors.state)}>
                <FieldLabel htmlFor="organization-state">UF</FieldLabel>
                <Select
                  name="state"
                  required
                  value={address.state || null}
                  onValueChange={(value) => {
                    updateAddress("state", value ?? "");
                    setFieldErrors((current) => ({ ...current, state: undefined }));
                  }}
                >
                  <SelectTrigger
                    id="organization-state"
                    className="w-full"
                    aria-invalid={Boolean(errors.state)}
                    aria-describedby={errors.state ? "organization-state-error" : undefined}
                  >
                    <SelectValue placeholder="Selecione a UF">
                      {(value) => {
                        const selected = BRAZILIAN_STATES.find(
                          (stateOption) => stateOption.code === value,
                        );
                        return selected
                          ? `${selected.code} - ${selected.name}`
                          : "Selecione a UF";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {BRAZILIAN_STATES.map((stateOption) => (
                        <SelectItem key={stateOption.code} value={stateOption.code}>
                          {stateOption.code} - {stateOption.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError id="organization-state-error">{errors.state}</FieldError>
              </Field>
              <Field><FieldLabel htmlFor="organizer-register-password">Senha</FieldLabel><PasswordInput id="organizer-register-password" name="password" autoComplete="new-password" required minLength={12} maxLength={128} showStrength /></Field>
              <Field><FieldLabel htmlFor="organizer-password-confirmation">Confirme a senha</FieldLabel><PasswordInput id="organizer-password-confirmation" name="passwordConfirmation" autoComplete="new-password" required minLength={12} maxLength={128} /></Field>
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
