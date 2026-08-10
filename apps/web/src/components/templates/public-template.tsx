import { PublicHeader } from "@/components/organisms/public-header";

export function PublicTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>{children}</main>
      <footer className="bg-ticket-ink text-ticket-paper">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-ticket-paper/70 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>Ticket Overlord · Verzel Elite Dev 2026</p>
          <p>Fundação visual com conteúdo demonstrativo.</p>
        </div>
      </footer>
    </div>
  );
}
