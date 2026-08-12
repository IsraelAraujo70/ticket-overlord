"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function TicketQr({ code, label }: { code: string; label: string }) {
  const [source, setSource] = useState<string>();

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(code, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 384,
      color: { dark: "#101426", light: "#ffffff" },
    }).then((value) => {
      if (active) setSource(value);
    });
    return () => {
      active = false;
    };
  }, [code]);

  return source ? (
    // The generated QR is already a local data URL and must keep exact pixels.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={source} alt={label} className="aspect-square w-full" />
  ) : (
    <div className="aspect-square w-full animate-pulse bg-ticket-mist" aria-label="Gerando QR Code" />
  );
}
