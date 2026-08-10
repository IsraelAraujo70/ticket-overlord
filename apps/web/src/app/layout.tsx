import type { Metadata } from "next";
import {
  Barlow_Condensed,
  IBM_Plex_Mono,
  Instrument_Sans,
} from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import "./globals.css";

const bodyFont = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

const displayFont = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  weight: ["600", "700"],
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Ticket Overlord",
  description: "Plataforma de eventos e ingressos.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        bodyFont.variable,
        displayFont.variable,
        monoFont.variable,
        "font-sans",
      )}
    >
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
