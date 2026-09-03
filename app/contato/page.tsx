import type { Metadata } from "next";
import { Mail, MessageCircle, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a ALGENRI sobre sites, IA, automação e sistemas.",
};

export default function ContatoPage() {
  return (
    <main className="page-shell min-h-screen">
      <section className="page-hero mx-auto max-w-7xl">
        <span className="eyebrow">Contato</span>
        <h1 className="section-title mt-5">Conte o que sua empresa precisa melhorar. A solução vem depois.</h1>
        <p className="section-copy mt-7">Você não precisa chegar sabendo qual tecnologia contratar. Explique o cenário, o problema ou a ideia e a ALGENRI organiza o melhor caminho.</p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-28 lg:grid-cols-3 lg:px-8">
        <a href="mailto:contato@algenri.com.br" className="glass rounded-[28px] p-7 transition hover:-translate-y-1">
          <Mail className="h-5 w-5 text-sky-200" />
          <p className="mt-7 text-sm text-white/38">E-mail</p>
          <h2 className="mt-2 text-xl font-semibold">contato@algenri.com.br</h2>
          <p className="mt-3 text-sm leading-6 text-white/52">Para propostas, dúvidas e contatos comerciais.</p>
        </a>

        <a href="/diagnostico" className="glass rounded-[28px] p-7 transition hover:-translate-y-1">
          <Sparkles className="h-5 w-5 text-violet-200" />
          <p className="mt-7 text-sm text-white/38">Não sabe qual solução pedir?</p>
          <h2 className="mt-2 text-xl font-semibold">Diagnóstico Digital</h2>
          <p className="mt-3 text-sm leading-6 text-white/52">Conte o cenário da empresa e receba uma análise inicial das prioridades.</p>
        </a>

        <div className="glass-soft rounded-[28px] p-7">
          <MessageCircle className="h-5 w-5 text-emerald-200" />
          <p className="mt-7 text-sm text-white/38">WhatsApp</p>
          <h2 className="mt-2 text-xl font-semibold">Canal em preparação</h2>
          <p className="mt-3 text-sm leading-6 text-white/52">O atendimento oficial pelo WhatsApp será integrado ao ecossistema ALGENRI em uma próxima etapa.</p>
        </div>
      </section>
    </main>
  );
}
