import { Clapperboard, Image as ImageIcon, Mic2, Sparkles, UserRound, WandSparkles } from "lucide-react";

const capabilities = [
  { title: "Vídeo", detail: "Cenas cinematográficas, reels, anúncios, institucionais e variações por formato.", icon: Clapperboard },
  { title: "Imagem", detail: "Referências visuais, keyframes, campanhas, produtos, personagens e assets.", icon: ImageIcon },
  { title: "Avatar", detail: "Apresentadores, clones autorizados, vestimenta, cenário e consistência visual.", icon: UserRound },
  { title: "Voz", detail: "Narração, clone autorizado, emoção, velocidade e dicionário de pronúncia.", icon: Mic2 },
  { title: "Roteiro", detail: "Ideia, roteiro, CTA, divisão por cenas e prompts técnicos por provedor.", icon: WandSparkles },
];

export default function AlgenriStudioPage() {
  return <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="border-b border-white/10 pb-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-200"><Sparkles className="h-4 w-4"/> ALGENRI Lab · Studio</div>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">ALGENRI Studio</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Central multimodal para planejar, gerar, revisar e organizar criações com IA. A primeira fase estabelece a arquitetura; os motores serão conectados progressivamente sem prender o Studio a um único fornecedor.</p>
      </div>

      <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {capabilities.map(({title,detail,icon:Icon}) => <article key={title} className="rounded-[22px] border border-white/10 bg-white/[.025] p-5"><div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.06]"><Icon className="h-5 w-5 text-cyan-200"/></div><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-xs leading-5 text-white/40">{detail}</p></article>)}
      </section>

      <section className="mt-6 rounded-[28px] border border-violet-300/15 bg-violet-300/[.025] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-violet-200">Fase 1</p><h2 className="mt-2 text-xl font-semibold">Estrutura preparada para múltiplos motores</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">Próxima evolução: projetos do Studio, integrações criativas, custos/créditos e primeiro fluxo real de geração com Runway e HeyGen. Depois entram Kie.ai e demais provedores selecionados por benchmark.</p></div>
          <span className="shrink-0 rounded-full border border-amber-300/15 bg-amber-300/[.05] px-4 py-2 text-xs text-amber-100">Integrações em preparação</span>
        </div>
      </section>
    </div>
  </main>;
}
