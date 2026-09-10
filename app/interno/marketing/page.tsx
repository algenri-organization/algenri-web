import { BarChart3, CalendarDays, Megaphone, Rocket, Share2, Target, Users } from "lucide-react";

const cards = [
  { title: "Planejamento", detail: "Objetivos, posicionamento, públicos, canais, metas e prioridades do marketing da ALGENRI.", icon: Target },
  { title: "Calendário de conteúdo", detail: "Organização de pautas, formatos, datas, responsáveis e status das publicações.", icon: CalendarDays },
  { title: "Campanhas", detail: "Campanhas institucionais, comerciais, lançamentos, anúncios e ações de aquisição.", icon: Megaphone },
  { title: "Redes sociais & crescimento", detail: "Estratégias para Instagram e demais canais, com foco em alcance, seguidores qualificados e conversão.", href: "/interno/marketing/redes-sociais", icon: Users, ready: true },
  { title: "Métricas", detail: "Indicadores de alcance, engajamento, crescimento, leads, conversão e desempenho por canal.", icon: BarChart3 },
  { title: "Distribuição", detail: "Fluxo de publicação e reaproveitamento de conteúdo entre Instagram, LinkedIn, TikTok e outros canais.", icon: Share2 },
];

export default function MarketingPage() {
  return <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="border-b border-white/10 pb-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-200"><Rocket className="h-4 w-4"/> Marketing</div>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Central de marketing da ALGENRI</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Área operacional para transformar o plano de marketing em execução contínua: conteúdo, campanhas, crescimento de audiência, distribuição e acompanhamento de resultados.</p>
      </div>

      <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({title,detail,href,icon:Icon,ready}) => {
          const content = <><div className="flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.06]"><Icon className="h-5 w-5 text-cyan-200"/></div><span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[.12em] ${ready?"border-emerald-300/15 bg-emerald-300/[.05] text-emerald-200":"border-white/10 text-white/30"}`}>{ready?"iniciar":"em breve"}</span></div><h2 className="mt-5 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-white/45">{detail}</p></>;
          return href ? <a key={title} href={href} className="rounded-[24px] border border-white/10 bg-white/[.025] p-5 transition hover:border-cyan-300/20 hover:bg-cyan-300/[.035]">{content}</a> : <article key={title} className="rounded-[24px] border border-white/10 bg-white/[.02] p-5">{content}</article>;
        })}
      </section>
    </div>
  </main>;
}
