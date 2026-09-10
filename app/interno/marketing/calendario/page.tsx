import { CalendarDays, CircleDot, Clock3, Instagram, Linkedin, Plus, Video } from "lucide-react";

const slots = [
  { day: "Segunda", format: "Reel", theme: "Dor / oportunidade", channel: "Instagram", icon: Video },
  { day: "Quarta", format: "Carrossel", theme: "Educação prática", channel: "Instagram", icon: Instagram },
  { day: "Sexta", format: "Case / bastidor", theme: "Prova e construção de autoridade", channel: "Instagram + LinkedIn", icon: Linkedin },
];

export default function MarketingCalendarPage() {
  return <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="border-b border-white/10 pb-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-200"><CalendarDays className="h-4 w-4"/> Marketing · Calendário</div>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Calendário editorial</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Estrutura inicial para organizar frequência, formatos, temas e canais. Nesta fase, o objetivo é consolidar a rotina antes de conectar automações de publicação.</p>
      </div>

      <section className="mt-7 grid gap-4 lg:grid-cols-3">
        {slots.map(({day,format,theme,channel,icon:Icon}) => <article key={day} className="rounded-[24px] border border-white/10 bg-white/[.025] p-5"><div className="flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.06]"><Icon className="h-5 w-5 text-cyan-200"/></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[.12em] text-white/35">base</span></div><h2 className="mt-5 text-lg font-semibold">{day}</h2><div className="mt-3 space-y-2 text-sm text-white/45"><p><strong className="text-white/70">Formato:</strong> {format}</p><p><strong className="text-white/70">Tema:</strong> {theme}</p><p><strong className="text-white/70">Canal:</strong> {channel}</p></div></article>)}
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
        <article className="rounded-[28px] border border-violet-300/15 bg-violet-300/[.025] p-6"><h2 className="text-xl font-semibold">Fluxo de conteúdo</h2><div className="mt-5 grid gap-3 md:grid-cols-4">{["Ideia", "Produção", "Revisão", "Publicado"].map((step,index)=><div key={step} className="rounded-2xl border border-white/10 bg-white/[.02] p-4"><div className="flex items-center gap-2 text-xs uppercase tracking-[.12em] text-white/35"><CircleDot className="h-3.5 w-3.5"/> etapa {index+1}</div><p className="mt-3 font-medium">{step}</p></div>)}</div></article>
        <article className="rounded-[28px] border border-amber-300/15 bg-amber-300/[.02] p-6"><div className="flex items-center gap-2 text-sm font-semibold text-amber-100"><Clock3 className="h-5 w-5"/> Cadência inicial</div><p className="mt-4 text-sm leading-6 text-white/50">Três publicações principais por semana, com stories e respostas de relacionamento distribuídos ao longo dos dias. A cadência poderá ser ajustada conforme os dados reais.</p><button disabled className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs text-white/30"><Plus className="h-4 w-4"/> Novo conteúdo · próxima fase</button></article>
      </section>
    </div>
  </main>;
}
