import type { Metadata } from "next";
import { Bot, Braces, Film, Globe2, Search, ShieldCheck, Workflow } from "lucide-react";

export const metadata: Metadata = {
  title: "Soluções",
  description: "Sites, IA, automação, sistemas e soluções digitais da ALGENRI.",
};

const groups = [
  { icon: Globe2, title: "Sites & presença digital", text: "Sites institucionais, landing pages, lojas virtuais, manutenção, domínio, SEO local e evolução contínua da presença online.", items: ["Sites institucionais", "Landing pages", "E-commerce", "Manutenção e evolução"] },
  { icon: Bot, title: "IA para negócios", text: "Aplicações de inteligência artificial pensadas para atendimento, produtividade, conteúdo e apoio à operação.", items: ["Atendimento com IA", "Agentes inteligentes", "Assistentes internos", "IA aplicada a processos"] },
  { icon: Workflow, title: "Automação", text: "Integrações e fluxos para reduzir tarefas manuais, acelerar respostas e manter informações conectadas.", items: ["WhatsApp e formulários", "CRM e leads", "Alertas e notificações", "Integrações entre ferramentas"] },
  { icon: Braces, title: "Sistemas sob medida", text: "Pequenos sistemas, portais e dashboards criados quando planilhas, e-mails e mensagens já não acompanham o processo.", items: ["Portais do cliente", "Dashboards", "Sistemas internos", "MVPs e SaaS"] },
  { icon: Film, title: "Creative AI", text: "Produção de comunicação visual e audiovisual com inteligência artificial para empresas e profissionais.", items: ["Vídeos com IA", "Avatares", "Imagens e campanhas", "Conteúdo institucional"] },
  { icon: Search, title: "Visibilidade & reputação", text: "Estrutura para melhorar presença em busca, mapas, avaliações e canais digitais importantes para a decisão do cliente.", items: ["SEO técnico", "Google Business", "Reputação online", "Análise de presença"] },
  { icon: ShieldCheck, title: "Base digital segura", text: "Configurações técnicas essenciais para profissionalizar os ativos digitais e reduzir riscos operacionais.", items: ["Domínio e DNS", "SSL e segurança", "Acessibilidade", "Implementação técnica LGPD"] },
];

export default function SolucoesPage() {
  return (
    <main className="page-shell min-h-screen">
      <section className="page-hero mx-auto max-w-7xl">
        <span className="eyebrow">Soluções ALGENRI</span>
        <h1 className="section-title mt-5">Tecnologia suficiente para resolver o problema de hoje — e estrutura para o próximo passo.</h1>
        <p className="section-copy mt-7">A proposta é evitar soluções isoladas. Site, atendimento, automação, IA e software podem trabalhar juntos conforme a maturidade e a necessidade de cada empresa.</p>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-28 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          {groups.map((group) => {
            const Icon = group.icon;
            return (
              <article key={group.title} className="glass rounded-[30px] p-7 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/7"><Icon className="h-5 w-5 text-sky-200" /></div>
                <h2 className="mt-7 text-2xl font-semibold tracking-[-0.02em]">{group.title}</h2>
                <p className="mt-3 max-w-xl leading-7 text-white/58">{group.text}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {group.items.map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/58">{item}</span>)}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 rounded-[32px] border border-white/10 bg-gradient-to-r from-blue-500/10 via-white/[0.04] to-violet-500/10 p-8 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div><p className="text-sm text-cyan-200">Não sabe por onde começar?</p><h2 className="mt-2 text-2xl font-semibold">Comece pelo Diagnóstico Digital ALGENRI.</h2></div>
          <a href="/diagnostico" className="button-primary mt-6 shrink-0 sm:mt-0">Solicitar diagnóstico</a>
        </div>
      </section>
    </main>
  );
}
