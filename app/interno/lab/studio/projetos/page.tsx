import { FolderKanban, Plus } from "lucide-react";
import StudioProjectLibrary from "@/components/studio/studio-project-library";

export default function StudioProjectsPage() {
  return <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-200"><FolderKanban className="h-4 w-4"/> ALGENRI Studio · Projetos</div>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Projetos do Studio</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Abra produções já iniciadas ou crie uma nova. O Studio mantém o contexto do projeto, storyboard, versões geradas, composição controlada e render final.</p>
        </div>
        <a href="/interno/lab/studio/projetos/novo" className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[.08] px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/[.12]"><Plus className="h-4 w-4"/> Novo projeto</a>
      </div>
      <StudioProjectLibrary />
    </div>
  </main>;
}
