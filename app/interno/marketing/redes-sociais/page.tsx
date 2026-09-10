import { ArrowUpRight, Instagram, LineChart, MessageCircle, Target, Users } from "lucide-react";

const pillars = [
  { title: "Atrair", detail: "Conteúdos de descoberta com dores reais de empresas, tendências, bastidores e demonstrações curtas das soluções ALGENRI.", icon: Target },
  { title: "Engajar", detail: "Carrosséis, reels, enquetes, perguntas, comentários e respostas rápidas para transformar alcance em relacionamento.", icon: MessageCircle },
  { title: "Converter", detail: "CTAs para demonstração, diagnóstico, conversa comercial e páginas de captura ligadas às campanhas.", icon: ArrowUpRight },
  { title: "Medir", detail: "Acompanhar seguidores qualificados, alcance, salvamentos, compartilhamentos, visitas ao perfil, leads e conversões.", icon: LineChart },
];

export default function SocialGrowthPage() {
  return <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="border-b border-white/10 pb-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-pink-200"><Instagram className="h-4 w-4"/> Marketing · Redes sociais</div>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Crescimento de audiência e seguidores</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Primeiro núcleo operacional dedicado ao crescimento orgânico da ALGENRI, com prioridade para Instagram e foco em audiência qualificada — não apenas volume de seguidores.</p>
      </div>

      <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pillars.map(({title,detail,icon:Icon}) => <article key={title} className="rounded-[22px] border border-white/10 bg-white/[.025] p-5"><div className="grid h-10 w-10 place-items-center rounded-xl border border-pink-300/15 bg-pink-300/[.06]"><Icon className="h-5 w-5 text-pink-200"/></div><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-xs leading-5 text-white/40">{detail}</p></article>)}
      </section>

      <section className="mt-6 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[.025] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-200">Próxima evolução</p><h2 className="mt-2 text-xl font-semibold">Painel de metas, calendário e acompanhamento</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">A próxima fase conectará metas mensais, calendário editorial, cadastro de conteúdos, status de publicação e indicadores de crescimento para transformar esta estratégia em rotina operacional.</p></div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-4 py-2 text-xs text-white/60"><Users className="h-4 w-4"/> Instagram em prioridade</span>
        </div>
      </section>
    </div>
  </main>;
}
