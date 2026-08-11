"use client";

import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPasswordStrength,
  STRONG_PASSWORD_PATTERN,
} from "@/lib/password-strength";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<ComponentProps<typeof Input>, "type"> {
  showStrength?: boolean;
}

const strengthStyles = {
  Fraca: "bg-destructive",
  Média: "bg-ticket-coral",
  Forte: "bg-primary",
} as const;

export function PasswordInput({
  "aria-describedby": ariaDescribedBy,
  className,
  defaultValue,
  id,
  onChange,
  pattern,
  showStrength = false,
  value,
  ...props
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const strengthId = `${inputId}-strength`;
  const [visible, setVisible] = useState(false);
  const [internalValue, setInternalValue] = useState(
    typeof defaultValue === "string" ? defaultValue : "",
  );
  const password = typeof value === "string" ? value : internalValue;
  const strength = getPasswordStrength(password);
  const activeSegments =
    strength.label === "Forte" ? 3 : strength.label === "Média" ? 2 : password ? 1 : 0;
  const describedBy = [ariaDescribedBy, showStrength ? strengthId : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="grid gap-2">
      <div className="flex">
        <Input
          {...props}
          id={inputId}
          type={visible ? "text" : "password"}
          className={cn("rounded-r-none border-r-0 focus-visible:z-10", className)}
          aria-describedby={describedBy || undefined}
          defaultValue={defaultValue}
          value={value}
          pattern={showStrength ? pattern ?? STRONG_PASSWORD_PATTERN : pattern}
          title={
            showStrength
              ? "Use de 12 a 128 caracteres, com letra maiúscula, letra minúscula, número e símbolo diferente de espaço."
              : props.title
          }
          onChange={(event) => {
            setInternalValue(event.currentTarget.value);
            onChange?.(event);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 rounded-l-none border-input bg-transparent text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
        </Button>
      </div>

      {showStrength ? (
        <div id={strengthId} className="grid gap-2" aria-live="polite">
          <div className="flex items-center gap-3">
            <div
              className="grid flex-1 grid-cols-3 gap-1"
              role="meter"
              aria-label="Força da senha"
              aria-valuemin={0}
              aria-valuemax={4}
              aria-valuenow={strength.score}
            >
              {[0, 1, 2].map((segment) => (
                <span
                  key={segment}
                  className={cn(
                    "h-1.5 rounded-full bg-ticket-mist transition-colors motion-reduce:transition-none",
                    segment < activeSegments && strengthStyles[strength.label],
                  )}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="min-w-12 text-right text-xs font-semibold text-ticket-ink">
              {strength.label}
            </span>
          </div>
          <ul className="grid gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
            {strength.requirements.map((requirement) => (
              <li key={requirement.id} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full border",
                    requirement.met && "border-primary bg-primary text-primary-foreground",
                  )}
                  aria-hidden="true"
                >
                  {requirement.met ? <CheckIcon /> : <XIcon />}
                </span>
                <span className={requirement.met ? "text-foreground" : undefined}>
                  {requirement.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
