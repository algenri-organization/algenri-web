import { BookOpenCheck, Clapperboard, Coins, FolderKanban, Image as ImageIcon, Layers3, Mic2, PlugZap, Sparkles, UserRound, WandSparkles } from "lucide-react";
import { productionStages, studioProviders } from "@/lib/studio/providers";

const capabilities = [
  { title: "Vídeo", detail: "Cenas cinematográficas, reels, anúncios, institucionais e variações por formato.", icon: Clapperboard },
  { title: "Imagem", detail: "Referências visuais, keyframes, campanhas, produtos, personagens e assets.", icon: ImageIcon },
  { title: "Avatar", detail: "Apresentadores autorizados, vestimenta, cenário e consistência visual.", icon: UserRound },
  { title: "Voz", detail: "Narração, clone autorizado, emoção, velocidade e dicionário de pronúncia.", icon: Mic2 },
  { title: "Roteiro", detail: "Ideia, roteiro, CTA, divisão por cenas e prompts técnicos por provedor.", icon: WandSparkles },
];

const foundation = [
  { title: "Projetos", detail: "Cada produção terá briefing, roteiro, storyboard, assets, versões e aprovação.", href: "/interno/lab/studio/projetos", icon: Layers3 },
  { title: "Provedores & APIs", detail: "Runway, Higgsfield, HeyGen, Remotion, Canva, Kie.ai e outras camadas criativas.", href: "/interno/lab/studio/integracoes", icon: PlugZap },
  { title: "Custos & créditos", detail: "Estimativa antes da geração, teto por projeto e histórico por cena e versão.", icon: Coins },
  { title: "Playbook", detail: "Cursos, documentação, testes e aprendizados convertidos em regras e templates reutilizáveis.", icon: BookOpenCheck },
];

export default function AlgenriStudioPage() {
  return <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-200"><Sparkles className="h-4 w-4"/> ALGENRI Lab · Studio</div>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">ALGENRI Studio</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Fábrica multimodal da ALGENRI para planejar, gerar, revisar e versionar criações com IA. O Studio cria; Marketing planeja campanhas e distribui os ativos. A arquitetura é agnóstica de fornecedor para escolher o melhor motor por tarefa, qualidade e custo.</p>
        </div>
        <div className="flex flex-wrap gap-2"><a href="/interno/lab/studio/integracoes" className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-300/20 bg-violet-300/[.06] px-4 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-300/[.1]"><PlugZap className="h-4 w-4"/> Integrações</a><a href="/interno/lab/studio/projetos" className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[.08] px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/[.12]"><FolderKanban className="h-4 w-4"/> Abrir projetos</a></div>
      </div>

      <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {capabilities.map(({title,detail,icon:Icon}) => <article key={title} className="rounded-[22px] border border-white/10 bg-white/[.025] p-5"><div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.06]"><Icon className="h-5 w-5 text-cyan-200"/></div><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-xs leading-5 text-white/40">{detail}</p></article>)}
      </section>

      <section className="mt-7">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-violet-200">Fundação do produto</p><h2 className="mt-2 text-xl font-semibold">Arquitetura antes de consumir créditos</h2></div><span className="rounded-full border border-emerald-300/15 bg-emerald-300/[.05] px-3 py-1.5 text-[10px] uppercase tracking-[.12em] text-emerald-200">Fase 1 em construção</span></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{foundation.map(({title,detail,href,icon:Icon}) => {
          const content = <><Icon className="h-5 w-5 text-violet-200"/><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-white/40">{detail}</p></>;
          return href ? <a key={title} href={href} className="rounded-[22px] border border-white/10 bg-white/[.02] p-5 transition hover:border-violet-300/20 hover:bg-violet-300/[.03]">{content}</a> : <article key={title} className="rounded-[22px] border border-white/10 bg-white/[.02] p-5">{content}</article>;
        })}</div>
      </section>

      <section className="mt-7 rounded-[28px] border border-white/10 bg-white/[.018] p-6">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-200">Pipeline padrão</p>
        <h2 className="mt-2 text-xl font-semibold">Produção por etapas, não por tentativa e erro</h2>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{productionStages.map((stage,index)=><div key={stage} className="rounded-xl border border-white/10 bg-white/[.025] px-3 py-3 text-xs text-white/55"><span className="mr-2 text-cyan-200/70">{String(index+1).padStart(2,"0")}</span>{stage}</div>)}</div>
      </section>

      <section className="mt-7">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-violet-200">Ecossistema criativo</p>
        <h2 className="mt-2 text-xl font-semibold">Provedores previstos por função</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">{studioProviders.map(provider=><article key={provider.id} className="rounded-[24px] border border-white/10 bg-white/[.02] p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{provider.name}</h3><span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[.1em] ${provider.status==="priority"?"border-cyan-300/15 bg-cyan-300/[.05] text-cyan-200":"border-white/10 text-white/30"}`}>{provider.status==="priority"?"prioridade":provider.status}</span></div><p className="mt-3 text-xs leading-5 text-white/45">{provider.role}</p><div className="mt-4 border-t border-white/10 pt-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/30">Controle de custo</p><p className="mt-2 text-xs leading-5 text-white/40">{provider.costControl}</p></div></article>)}</div>
      </section>

      <section className="mt-7 rounded-[28px] border border-amber-300/15 bg-amber-300/[.025] p-6">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-amber-100">Regra de geração</p><h2 className="mt-2 text-xl font-semibold">Validar barato antes de renderizar caro</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-white/45">Sempre que o provedor permitir, o Studio deverá validar roteiro, referências, avatar/look, voz, pronúncia e keyframe ou trecho curto antes do vídeo completo. Reprovação de uma cena deve regenerar a cena — não destruir uma versão inteira já aprovada.</p>
      </section>
    </div>
  </main>;
}
