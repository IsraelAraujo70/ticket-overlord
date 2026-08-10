import Link from "next/link";

import { Logo } from "@/components/atoms/logo";

export function PublicFooter() {
  return (
    <footer className="bg-ticket-ink text-ticket-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8">
        <div className="space-y-5">
          <Logo inverted />
          <p className="max-w-xs text-sm leading-6 text-ticket-paper/60">
            Eventos que saem da tela e viram histórias para contar.
          </p>
          {/* #todo REMOVE: Replace the temporary social availability notice with real links. */}
          <p className="font-mono text-xs tracking-[0.12em] text-ticket-paper/45 uppercase">
            Redes sociais em breve
          </p>
        </div>
        <div>
          <h2 className="font-mono text-xs font-semibold tracking-[0.16em] uppercase">Acesso rápido</h2>
          <ul className="mt-4 space-y-3 text-sm text-ticket-paper/65">
            <li><Link href="/login" className="hover:text-white">Entrar</Link></li>
            <li><Link href="/cadastro" className="hover:text-white">Criar conta</Link></li>
            <li><Link href="/#eventos" className="hover:text-white">Explorar eventos</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-mono text-xs font-semibold tracking-[0.16em] uppercase">Atendimento</h2>
          {/* #todo REMOVE: Replace the temporary support content when the help center is available. */}
          <ul className="mt-4 space-y-3 text-sm text-ticket-paper/65">
            <li>Central de ajuda em breve</li>
            <li>Segunda a sexta, 9h às 18h</li>
          </ul>
        </div>
        <div>
          <h2 className="font-mono text-xs font-semibold tracking-[0.16em] uppercase">Informações</h2>
          {/* #todo REMOVE: Replace the temporary legal notices with published documents. */}
          <ul className="mt-4 space-y-3 text-sm text-ticket-paper/65">
            <li>Termos de uso em elaboração</li>
            <li>Privacidade em elaboração</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-ticket-paper/45 sm:flex-row sm:justify-between lg:px-8">
          <p>© 2026 Ticket Overlord.</p>
          {/* #todo REMOVE: Remove the temporary challenge label before the product release. */}
          <p>Projeto demonstrativo · Verzel Elite Dev 2026</p>
        </div>
      </div>
    </footer>
  );
}
