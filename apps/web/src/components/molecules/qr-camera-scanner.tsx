"use client";

import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { CameraIcon, CameraOffIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function QrCameraScanner({ onScan }: { onScan: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | undefined>(undefined);
  const [state, setState] = useState<"idle" | "starting" | "active" | "error">("idle");

  useEffect(() => () => controlsRef.current?.stop(), []);

  async function start(): Promise<void> {
    if (!videoRef.current) return;
    controlsRef.current?.stop();
    setState("starting");
    try {
      const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 200 });
      controlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        videoRef.current,
        (result) => {
          if (!result) return;
          controlsRef.current?.stop();
          setState("idle");
          onScan(result.getText());
        },
      );
      setState("active");
    } catch {
      setState("error");
    }
  }

  function stop(): void {
    controlsRef.current?.stop();
    setState("idle");
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-ticket-ink text-ticket-paper">
      <div className="relative aspect-[4/3] bg-black">
        <video ref={videoRef} className="size-full object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-[12%] rounded-2xl border-2 border-ticket-coral shadow-[0_0_0_999px_rgb(0_0_0/35%)]" />
        {state !== "active" && state !== "starting" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ticket-ink/90 p-6 text-center">
            <CameraIcon className="size-10 text-ticket-coral" aria-hidden="true" />
            <p className="text-sm text-ticket-paper/70">
              A câmera traseira será usada somente enquanto esta leitura estiver aberta.
            </p>
          </div>
        ) : null}
      </div>
      <div className="p-4">
        {state === "error" ? (
          <p role="alert" className="mb-3 flex gap-2 text-sm text-ticket-coral">
            <CameraOffIcon className="size-5 shrink-0" aria-hidden="true" />
            Não foi possível abrir a câmera. Use o código manual abaixo.
          </p>
        ) : null}
        {state === "active" ? (
          <Button type="button" variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={stop}>
            Fechar câmera
          </Button>
        ) : (
          <Button type="button" className="w-full" onClick={() => void start()} disabled={state === "starting"}>
            <CameraIcon aria-hidden="true" />
            {state === "starting" ? "Abrindo câmera..." : "Ler QR Code"}
          </Button>
        )}
      </div>
    </section>
  );
}
