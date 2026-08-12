"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyShareLink({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/ingresso/${token}`);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2_000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <Button type="button" variant="outline" className="w-full" onClick={() => void copy()}>
        {status === "copied" ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
        {status === "copied" ? "Link copiado" : "Copiar link do ingresso"}
      </Button>
      {status === "error" ? (
        <p role="alert" className="mt-2 text-center text-xs text-destructive">
          Não foi possível copiar. Abra esta página em uma conexão segura.
        </p>
      ) : null}
    </div>
  );
}
