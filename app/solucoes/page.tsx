import type { Metadata } from "next";
import { ArrowRight, Bot, Braces, Film, Globe2, Search, ShieldCheck, Sparkles, Workflow } from "lucide-react";

export const metadata: Metadata = {
  title: "Soluções",
  description: "Sites, IA, automação, sistemas e soluções digitais da ALGENRI.",
};

const groups = [
  { icon: Globe2, title: "Sites & presença digital", text: "Sites institucionais, landing pages, lojas virtuais, manutenção, domínio, SEO local e evolução contínua da presença online.", items: ["Sites institucionais", "Landing pages", "E-commerce", "Manutenção e evolução"], accent: "from-blue-500/22 to-cyan-400/5" },
  { icon: Bot, title: "IA para negócios", text: "Aplicações de inteligência artificial pensadas para atendimento, produtividade, conteúdo e apoio à operação.", items: ["Atendimento com IA", "Agentes inteligentes", "Assistentes internos", "IA aplicada a processos"], accent: "from-cyan-400/22 to-blue-500/5" },
  { icon: Workflow, title: "Automação", text: "Integrações e fluxos para reduzir tarefas manuais, acelerar respostas e manter informações conectadas.", items: ["WhatsApp e formulários", "CRM e leads", "Alertas e notificações", "Integrações entre ferramentas"], accent: "from-violet-500/22 to-blue-500/5" },
  { icon: Braces, title: "Sistemas sob medida", text: "Pequenos sistemas, portais e dashboards criados quando planilhas, e-mails e mensagens já não acompanham o processo.", items: ["Portais do cliente", "Dashboards", "Sistemas internos", "MVPs e SaaS"], accent: "from-blue-500/18 to-violet-500/8" },
  { icon: Film, title: "Creative AI", text: "Produção de comunicação visual e audiovisual com inteligência artificial para empresas e profissionais.", items: ["Vídeos com IA", "Avatares", "Imagens e campanhas", "Conteúdo institucional"], accent: "from-violet-500/24 to-fuchsia-500/5" },
  { icon: Search, title: "Visibilidade & reputação", text: "Estrutura para melhorar presença em busca, mapas, avaliações e canais digitais importantes para a decisão do cliente.", items: ["SEO técnico", "Google Business", "Reputação online", "Análise de presença"], accent: "from-cyan-400/18 to-emerald-400/5" },
  { icon: ShieldCheck, title: "Base digital segura", text: "Configurações técnicas essenciais para profissionalizar os ativos digitais e reduzir riscos operacionais.", items: ["Domínio e DNS", "SSL e segurança", "Acessibilidade", "Implementação técnica LGPD"], accent: "from-slate-400/15 to-blue-500/6" },
];

const journey = [
  ["01", "Presença", "Site, domínio, Google e uma comunicação digital confiável."],
  ["02", "Eficiência", "Automação e IA para reduzir tarefas manuais e acelerar respostas."],
  ["03", "Escala", "Sistemas e integrações próprias quando a operação exige mais controle."],
];

export default function SolucoesPage() {
  return (
    <main className="page-shell min-h-screen overflow-hidden">
      <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-28 lg:px-8 lg:pt-36">
        <div className="pointer-events-none absolute right-[-120px] top-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative grid gap-12 lg:grid-cols-[1.08fr_.92fr] lg:items-end">
          <div>
            <span className="eyebrow"><Sparkles className="h-4 w-4" /> Soluções ALGENRI</span>
            <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-[1.01] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Tecnologia que começa no necessário e <span className="gradient-text">evolui com o negócio.</span>
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-white/60">
              Evitamos soluções isoladas. Site, atendimento, automação, IA e software podem trabalhar juntos conforme a maturidade, o momento e a prioridade de cada empresa.
            </p>
          </div>

          <div className="glass relative overflow-hidden rounded-[30px] p-6">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-violet-500/20 blur-3xl" />
            <p className="relative text-xs uppercase tracking-[.18em] text-white/35">Ecossistema digital</p>
            <div className="relative mt-5 space-y-3">
              {journey.map(([number, title, text]) => (
                <div key={number} className="flex gap-4 rounded-2xl border border-white/8 bg-black/15 p-4">
                  <span className="text-xs text-cyan-200/70">{number}</span>
                  <div><p className="font-medium">{title}</p><p className="mt-1 text-sm leading-6 text-white/48">{text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-28 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          {groups.map((group, index) => {
            const Icon = group.icon;
            return (
              <article key={group.title} className="group glass relative overflow-hidden rounded-[30px] p-7 transition duration-300 hover:-translate-y-1 sm:p-8">
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${group.accent} opacity-0 transition duration-300 group-hover:opacity-100`} />
                <div className="relative">
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/7 shadow-[0_0_35px_rgba(0,229,255,.06)]"><Icon className="h-5 w-5 text-cyan-100" /></div>
                    <span className="text-xs text-white/22">0{index + 1}</span>
                  </div>
                  <h2 className="mt-7 text-2xl font-semibold tracking-[-0.02em]">{group.title}</h2>
                  <p className="mt-3 max-w-xl leading-7 text-white/58">{group.text}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {group.items.map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/58">{item}</span>)}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="glass mt-12 overflow-hidden rounded-[34px] p-8 sm:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <span className="eyebrow">Próximo passo</span>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Não sabe qual solução faz mais sentido primeiro?</h2>
              <p className="mt-4 max-w-2xl leading-7 text-white/55">O Diagnóstico Digital ALGENRI identifica prioridades e mostra onde existe maior potencial de ganho em presença, atendimento, automação e tecnologia.</p>
            </div>
            <a href="/diagnostico" className="button-primary shrink-0">Iniciar diagnóstico <ArrowRight className="h-4 w-4" /></a>
          </div>
        </div>
      </section>
    </main>
  );
}
