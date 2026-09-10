"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, Film, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Scene = {
  index: number;
  title: string;
  durationSeconds: number;
  objective: string;
  narration: string;
  visualDirection: string;
  technicalPrompt: string;
  status: string;
};

type Project = {
  id: string;
  name: string;
  status: string;
  briefing?: {
    destination?: string;
    durationSeconds?: number;
    visualStyle?: string;
    aspectRatio?: string;
    engineMode?: string;
    priority?: string;
  };
  storyboard?: Scene[];
};

export default function StudioProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    params.then(({ projectId }) => {
      if (active) setProjectId(projectId);
    });
    return () => { active = false; };
  }, [params]);

  useEffect(() => {
    if (!projectId) return;
    const unsubscribe = firebaseAuth.onAuthStateChanged(async user => {
      if (!user) {
        setLoading(false);
        setError("Sessão não encontrada.");
        return;
      }
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/internal/studio/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.project) throw new Error(payload.error || "Não foi possível carregar o projeto.");
        setProject(payload.project);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível carregar o projeto.");
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [projectId]);

  return <main className="min-h-screen bg-[#040c17] px-5 pb-24 pt-24 text-white sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <a href="/interno/lab/studio/projetos" className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white"><ArrowLeft className="h-4 w-4"/> Voltar aos projetos</a>

      {loading && <div className="mt-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.02] p-5 text-sm text-white/50"><Loader2 className="h-4 w-4 animate-spin"/> Carregando projeto...</div>}
      {error && <div className="mt-10 flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[.04] p-5"><TriangleAlert className="h-5 w-5 text-amber-100"/><div><p className="font-semibold text-amber-100">Falha ao carregar</p><p className="mt-1 text-sm text-white/45">{error}</p></div></div>}

      {project && <>
        <div className="mt-5 border-b border-white/10 pb-7">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-200"><Film className="h-4 w-4"/> ALGENRI Studio · Projeto</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">{project.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Primeira estrutura de storyboard preparada a partir do briefing. Ainda não há geração paga nesta etapa.</p>
        </div>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["Status", project.status || "planning"],
            ["Destino", project.briefing?.destination || "—"],
            ["Duração", project.briefing?.durationSeconds ? `${project.briefing.durationSeconds}s` : "—"],
            ["Estilo", project.briefing?.visualStyle || "—"],
            ["Formato", project.briefing?.aspectRatio || "—"],
            ["Motor", project.briefing?.engineMode || "—"],
          ].map(([label,value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.02] p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">{label}</p><p className="mt-2 text-sm font-semibold text-white/70">{value}</p></div>)}
        </section>

        <section className="mt-8">
          <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-violet-200"/><h2 className="text-xl font-semibold">Storyboard inicial</h2></div>
          <p className="mt-2 text-sm text-white/40">As cenas abaixo serão a base para a próxima camada de IA, que refinaremos antes de gerar vídeo.</p>
          <div className="mt-5 space-y-4">{(project.storyboard || []).map(scene => <article key={scene.index} className="rounded-[26px] border border-white/10 bg-white/[.02] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs uppercase tracking-[.12em] text-cyan-200/70">Cena {scene.index}</p><h3 className="mt-1 text-lg font-semibold">{scene.title}</h3></div><div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-white/45"><Clock3 className="h-3.5 w-3.5"/>{scene.durationSeconds}s</div></div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Objetivo da cena</p><p className="mt-2 text-sm leading-6 text-white/60">{scene.objective}</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Locução-base</p><p className="mt-2 text-sm leading-6 text-white/60">{scene.narration}</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Direção visual</p><p className="mt-2 text-sm leading-6 text-white/60">{scene.visualDirection}</p></div>
              <div className="rounded-2xl border border-violet-300/10 bg-violet-300/[.025] p-4"><p className="text-[10px] uppercase tracking-[.12em] text-violet-200/70">Prompt técnico base</p><p className="mt-2 text-sm leading-6 text-white/60">{scene.technicalPrompt}</p></div>
            </div>
          </article>)}</div>
        </section>

        <section className="mt-8 rounded-[26px] border border-emerald-300/15 bg-emerald-300/[.025] p-5"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-200"/><div><h2 className="font-semibold">Projeto persistido com sucesso</h2><p className="mt-2 text-sm leading-6 text-white/45">Briefing, storyboard inicial e estrutura de acompanhamento de geração/custos já ficam registrados. A próxima etapa será substituir esse scaffold por roteiro e storyboard refinados por IA, com edição e aprovação por cena antes do roteamento para os motores.</p></div></div></section>
      </>}
    </div>
  </main>;
}
