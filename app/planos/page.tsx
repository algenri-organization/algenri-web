import type { Metadata } from "next";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Planos",
  description: "Planos de manutenção e evolução digital da ALGENRI.",
};

const plans = [
  {
    name: "Essencial",
    price: "R$ 349",
    period: "/mês",
    intro: "Para manter a presença digital profissional e atualizada.",
    features: ["Até 45 min de ajustes por mês", "Manutenção do site", "Pequenas alterações de conteúdo", "Acompanhamento técnico", "Suporte em horário comercial"],
  },
  {
    name: "Profissional",
    price: "R$ 699",
    period: "/mês",
    intro: "Para empresas que querem presença ativa e evolução contínua.",
    featured: true,
    features: ["Até 90 min de ajustes por mês", "Tudo do Essencial", "Acompanhamento de presença digital", "SEO local e Google", "Reputação e oportunidades de melhoria"],
  },
  {
    name: "Digital 360",
    price: "R$ 1.390",
    period: "/mês",
    intro: "Para transformar presença, conteúdo e automação em uma operação digital integrada.",
    features: ["Até 3,5 h de evolução por mês", "Tudo do Profissional", "1 vídeo simples com IA por mês", "Automação simples incluída", "Conteúdo e melhorias orientadas", "Revisão digital periódica"],
  },
];

export default function PlanosPage() {
  return (
    <main className="page-shell min-h-screen">
      <section className="page-hero mx-auto max-w-7xl">
        <span className="eyebrow">Planos de evolução</span>
        <h1 className="section-title mt-5">Depois de publicar, o digital precisa continuar evoluindo.</h1>
        <p className="section-copy mt-7">Os planos ALGENRI transformam manutenção em acompanhamento contínuo. O objetivo é manter os ativos digitais atualizados e abrir espaço para novas melhorias sem começar um novo projeto a cada pequena necessidade.</p>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-28 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative rounded-[30px] p-7 ${plan.featured ? "glass ring-1 ring-cyan-300/25" : "glass-soft"}`}>
              {plan.featured && <span className="absolute right-6 top-6 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">Mais completo</span>}
              <p className="text-lg font-semibold">{plan.name}</p>
              <div className="mt-6 flex items-end gap-1"><span className="text-4xl font-semibold tracking-[-0.04em]">{plan.price}</span><span className="pb-1 text-sm text-white/40">{plan.period}</span></div>
              <p className="mt-4 min-h-20 leading-7 text-white/56">{plan.intro}</p>
              <div className="my-6 h-px bg-white/10" />
              <ul className="space-y-3">
                {plan.features.map((feature) => <li key={feature} className="flex gap-3 text-sm leading-6 text-white/65"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />{feature}</li>)}
              </ul>
              <a href="/diagnostico" className={plan.featured ? "button-primary mt-8 w-full" : "button-secondary mt-8 w-full"}>Conversar sobre este plano</a>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-white/38">Valores de referência para o lançamento da ALGENRI. Projetos de implantação, serviços de terceiros, consumo de APIs e demandas fora do escopo mensal são orçados separadamente.</p>
      </section>
    </main>
  );
}
