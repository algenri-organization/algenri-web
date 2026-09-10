import { ArrowRight, Gauge, Rocket, Target, Users } from "lucide-react";

const funnel = [
  { title: "Descoberta", detail: "Conteúdo, campanhas, cases e presença digital atraem empresas com problemas compatíveis com as soluções ALGENRI.", icon: Rocket },
  { title: "Diagnóstico digital", detail: "Uma experiência guiada identifica maturidade, gargalos, oportunidades e possíveis frentes de automação, IA ou produto digital.", icon: Gauge },
  { title: "Lead qualificado", detail: "As respostas e sinais de intenção alimentam o processo comercial com contexto suficiente para uma abordagem consultiva.", icon: Users },
  { title: "Próxima ação", detail: "Demonstração, conversa comercial, protótipo ou proposta são acionados conforme o diagnóstico e o grau de prontidão.", icon: Target },
];

export default function AcquisitionPage() {
  return <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="border-b border-white/10 pb-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-emerald-200"><Target className="h-4 w-4"/> Marketing · Aquisição & Diagnóstico Digital</div>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Transformar audiência em oportunidade qualificada</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">A aquisição da ALGENRI deve conectar marketing e comercial sem depender apenas de formulários genéricos. O Diagnóstico Digital será a principal ponte para captar contexto, demonstrar valor e indicar a melhor próxima ação.</p>
      </div>

      <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {funnel.map(({title,detail,icon:Icon}, index) => <article key={title} className="relative rounded-[22px] border border-white/10 bg-white/[.025] p-5"><div className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-300/15 bg-emerald-300/[.06]"><Icon className="h-5 w-5 text-emerald-200"/></div><p className="mt-4 text-[10px] uppercase tracking-[.16em] text-white/25">Etapa {index+1}</p><h2 className="mt-1 font-semibold">{title}</h2><p className="mt-2 text-xs leading-5 text-white/40">{detail}</p>{index < funnel.length-1 && <ArrowRight className="absolute -right-3 top-8 hidden h-5 w-5 text-white/20 xl:block"/>}</article>)}
      </section>

      <section className="mt-6 rounded-[28px] border border-amber-300/15 bg-amber-300/[.025] p-6">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-amber-100">Roadmap</p><h2 className="mt-2 text-xl font-semibold">Primeiro consolidar conteúdo e cases; depois ativar o Diagnóstico Digital</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-white/45">A arquitetura já fica visível no Marketing, mas a implementação transacional do diagnóstico entra em uma fase posterior, quando conteúdo-base, rastreamento de leads e primeiros cases estiverem consolidados.</p>
      </section>
    </div>
  </main>;
}
