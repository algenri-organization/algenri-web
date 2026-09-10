import { ArrowRight, Clapperboard, FolderKanban, Image as ImageIcon, Mic2, Plus, Sparkles, UserRound } from "lucide-react";

const projectTypes = [
  { title: "Vídeo", detail: "Produções por cenas com roteiro, storyboard, keyframes e revisão por versão.", icon: Clapperboard },
  { title: "Imagem", detail: "Assets, campanhas, keyframes, referências e variações visuais.", icon: ImageIcon },
  { title: "Avatar", detail: "Projetos com apresentador autorizado, voz, look e cenário consistentes.", icon: UserRound },
  { title: "Voz", detail: "Narração, pronúncia, emoção e versões de áudio independentes do vídeo.", icon: Mic2 },
];

export default function StudioProjectsPage() {
  return <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-200"><FolderKanban className="h-4 w-4"/> ALGENRI Studio · Projetos</div>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Projetos do Studio</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Cada produção nasce como projeto independente, com objetivo, formato, público, destino, orçamento e histórico de decisões. É aqui que o Studio evita perda de contexto entre versões.</p>
        </div>
        <a href="/interno/lab/studio/projetos/novo" className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[.08] px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/[.12]"><Plus className="h-4 w-4"/> Novo projeto</a>
      </div>

      <section className="mt-7 rounded-[26px] border border-white/10 bg-white/[.02] p-6">
        <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-violet-200">Estrutura inicial</p><h2 className="mt-2 text-xl font-semibold">Um workspace para cada produção</h2></div><Sparkles className="h-5 w-5 text-violet-200"/></div>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/45">Nesta primeira versão, o foco é consolidar a estrutura de projeto antes de ligar qualquer API paga. O próximo passo será persistir os projetos e abrir o workspace com roteiro, cenas, assets, voz, custos e gerações.</p>
      </section>

      <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {projectTypes.map(({title,detail,icon:Icon}) => <article key={title} className="rounded-[22px] border border-white/10 bg-white/[.025] p-5"><Icon className="h-5 w-5 text-cyan-200"/><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-xs leading-5 text-white/40">{detail}</p></article>)}
      </section>

      <section className="mt-7 rounded-[28px] border border-amber-300/15 bg-amber-300/[.025] p-6">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-amber-100">Sem projetos ainda</p>
        <h2 className="mt-2 text-xl font-semibold">Crie o primeiro projeto real do Studio</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">O primeiro projeto será usado também como validação do fluxo e como referência para desenhar a primeira integração de vídeo com controle de custo.</p>
        <a href="/interno/lab/studio/projetos/novo" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-100">Criar primeiro projeto <ArrowRight className="h-4 w-4"/></a>
      </section>
    </div>
  </main>;
}
