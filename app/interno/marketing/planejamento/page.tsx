import { CheckCircle2, Flag, Goal, Lightbulb, Target, Users } from "lucide-react";

const objectives = [
  { title: "Marca", detail: "Aumentar reconhecimento e clareza de posicionamento da ALGENRI no mercado." },
  { title: "Audiência", detail: "Atrair seguidores e contatos qualificados, com prioridade para Instagram." },
  { title: "Demanda", detail: "Transformar conteúdo e campanhas em conversas comerciais e demonstrações." },
];

const audiences = [
  "Pequenas e médias empresas buscando presença digital mais profissional",
  "Negócios que precisam automatizar atendimento, marketing ou processos",
  "Empresas interessadas em soluções digitais sob medida e IA aplicada",
];

export default function MarketingPlanningPage() {
  return <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="border-b border-white/10 pb-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-200"><Target className="h-4 w-4"/> Marketing · Planejamento</div>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Plano de marketing operacional</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Base para transformar o posicionamento da ALGENRI em metas, públicos, prioridades e ações mensuráveis.</p>
      </div>

      <section className="mt-7 grid gap-4 md:grid-cols-3">
        {objectives.map((item) => <article key={item.title} className="rounded-[24px] border border-white/10 bg-white/[.025] p-5"><Goal className="h-5 w-5 text-cyan-200"/><h2 className="mt-4 font-semibold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-white/45">{item.detail}</p></article>)}
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <article className="rounded-[28px] border border-violet-300/15 bg-violet-300/[.025] p-6"><div className="flex items-center gap-2 text-sm font-semibold text-violet-100"><Users className="h-5 w-5"/> Públicos prioritários</div><div className="mt-4 space-y-3">{audiences.map((item) => <div key={item} className="flex gap-3 rounded-2xl border border-white/8 bg-white/[.02] p-4 text-sm leading-6 text-white/50"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-200"/><span>{item}</span></div>)}</div></article>
        <article className="rounded-[28px] border border-amber-300/15 bg-amber-300/[.02] p-6"><div className="flex items-center gap-2 text-sm font-semibold text-amber-100"><Flag className="h-5 w-5"/> Diretrizes atuais</div><div className="mt-4 space-y-3 text-sm leading-6 text-white/50"><p><strong className="text-white/75">Prioridade:</strong> Instagram como principal canal de crescimento orgânico.</p><p><strong className="text-white/75">Conteúdo:</strong> demonstrações, bastidores, dores reais, casos, educação prática e chamadas para demonstração.</p><p><strong className="text-white/75">Tom:</strong> profissional, atual, claro e orientado a valor, evitando comunicação genérica de agência.</p><p><strong className="text-white/75">Conversão:</strong> cada campanha deve apontar para uma ação comercial mensurável.</p></div></article>
      </section>

      <section className="mt-6 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[.025] p-6"><div className="flex items-start gap-3"><Lightbulb className="mt-0.5 h-5 w-5 text-cyan-200"/><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-200">Próxima fase</p><h2 className="mt-2 text-xl font-semibold">Metas editáveis e acompanhamento mensal</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">Esta página será evoluída para receber metas, responsáveis, prazos, prioridades e status, conectando planejamento, calendário e métricas em um único fluxo.</p></div></div></section>
    </div>
  </main>;
}
