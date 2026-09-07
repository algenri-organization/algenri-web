import type { Metadata } from "next";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Evolução Digital",
  description: "Acompanhamento contínuo para manter, melhorar e evoluir os ativos digitais da sua empresa.",
};

const plans = [
  {
    name: "Essencial",
    label: "Presença e manutenção",
    intro: "Para empresas que precisam manter sua presença digital profissional, atualizada e bem cuidada.",
    features: ["Manutenção do site", "Pequenas alterações de conteúdo", "Acompanhamento técnico", "Suporte em horário comercial", "Evoluções pontuais conforme necessidade"],
  },
  {
    name: "Profissional",
    label: "Evolução e performance",
    intro: "Para empresas que querem evoluir continuamente sua presença digital e identificar novas oportunidades de melhoria.",
    featured: true,
    features: ["Tudo do Essencial", "Acompanhamento de presença digital", "SEO local e Google", "Reputação e oportunidades de melhoria", "Priorização de melhorias ao longo do período"],
  },
  {
    name: "Digital 360",
    label: "Estratégia, conteúdo e automação",
    intro: "Para negócios que querem integrar presença digital, conteúdo, automação e inteligência artificial em uma evolução contínua.",
    features: ["Tudo do Profissional", "Conteúdo e melhorias orientadas", "Vídeos simples com IA conforme estratégia", "Automações de menor complexidade", "Revisão digital periódica e novas oportunidades"],
  },
];

export default function PlanosPage() {
  return (
    <main className="page-shell min-h-screen">
      <section className="page-hero mx-auto max-w-7xl">
        <span className="eyebrow">Evolução digital</span>
        <h1 className="section-title mt-5">Seu digital não termina na entrega. Ele precisa continuar evoluindo.</h1>
        <p className="section-copy mt-7">A ALGENRI acompanha cada empresa de forma consultiva. Entendemos o momento, os objetivos e a operação antes de recomendar o formato de acompanhamento mais adequado.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/diagnostico" className="button-primary">Solicitar diagnóstico</a>
          <a href="/contato" className="button-secondary">Conversar sobre sua necessidade</a>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-28 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative rounded-[30px] p-7 ${plan.featured ? "glass ring-1 ring-cyan-300/25" : "glass-soft"}`}>
              {plan.featured && <span className="absolute right-6 top-6 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">Mais indicado para evolução contínua</span>}
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-200/70">{plan.label}</p>
              <p className="mt-2 text-xl font-semibold">{plan.name}</p>
              <p className="mt-5 min-h-24 leading-7 text-white/56">{plan.intro}</p>
              <div className="my-6 h-px bg-white/10" />
              <ul className="space-y-3">
                {plan.features.map((feature) => <li key={feature} className="flex gap-3 text-sm leading-6 text-white/65"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />{feature}</li>)}
              </ul>
              <a href="/contato" className={plan.featured ? "button-primary mt-8 w-full" : "button-secondary mt-8 w-full"}>Solicitar proposta personalizada</a>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-[28px] border border-cyan-300/15 bg-cyan-300/[.035] p-6 text-center">
          <p className="text-lg font-semibold">Cada empresa tem uma necessidade diferente.</p>
          <p className="mt-3 text-sm leading-7 text-white/52">Por isso, investimento, escopo e frequência de acompanhamento são definidos após entendermos seu momento e seus objetivos. Projetos de implantação, serviços de terceiros e consumos de APIs são avaliados separadamente quando aplicável.</p>
          <a href="/diagnostico" className="button-primary mt-6">Quero entender a melhor solução</a>
        </div>
      </section>
    </main>
  );
}
