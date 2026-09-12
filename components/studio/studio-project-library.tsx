"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clapperboard, Clock3, Copy, FolderOpen, Loader2, Mic2, Pencil, Plus, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type ProjectSummary = {
  id: string;
  name: string;
  format: string;
  status: string;
  destination: string;
  aspectRatio: string;
  durationSeconds: number | null;
  visualStyle: string;
  sceneCount: number;
  generationState: string;
  finalRenderState: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  planning: "Planejamento",
  generating: "Em geração",
  review: "Em revisão",
  approved: "Aprovado",
  archived: "Arquivado",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export default function StudioProjectLibrary() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [duplicatingId, setDuplicatingId] = useState("");
  const [renamingId, setRenamingId] = useState("");
  const [error, setError] = useState("");

  async function token(){const user=firebaseAuth.currentUser;if(!user)throw new Error("Sessão não encontrada.");return user.getIdToken();}

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/internal/studio/projects", {
        headers: { Authorization: `Bearer ${await token()}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(payload.projects)) throw new Error(payload.error || "Não foi possível carregar os projetos.");
      setProjects(payload.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar projetos.");
    } finally {
      setLoading(false);
    }
  }

  async function renameProject(project: ProjectSummary) {
    const name = window.prompt("Novo nome do projeto:", project.name)?.trim();
    if (!name || name === project.name) return;
    setRenamingId(project.id);
    setError("");
    try {
      const response = await fetch(`/api/internal/studio/projects/${project.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Não foi possível renomear o projeto.");
      setProjects(current => current.map(item => item.id === project.id ? { ...item, name, updatedAt: new Date().toISOString() } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao renomear projeto.");
    } finally {
      setRenamingId("");
    }
  }

  async function duplicateProject(project: ProjectSummary) {
    const suggested = `${project.name} · Modelo`;
    const name = window.prompt("Nome da nova cópia/modelo:", suggested)?.trim();
    if (!name) return;
    setDuplicatingId(project.id);
    setError("");
    try {
      const response = await fetch(`/api/internal/studio/projects/${project.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate_template", name }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.projectId) throw new Error(payload.error || "Não foi possível duplicar o projeto.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao duplicar projeto.");
    } finally {
      setDuplicatingId("");
    }
  }

  async function remove(project: ProjectSummary) {
    if (!window.confirm(`Excluir o projeto “${project.name}”?\n\nO projeto e os arquivos internos vinculados ao Studio serão removidos. Esta ação não pode ser desfeita.`)) return;
    setDeletingId(project.id);
    setError("");
    try {
      const response = await fetch(`/api/internal/studio/projects/${project.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${await token()}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Não foi possível excluir o projeto.");
      setProjects(current => current.filter(item => item.id !== project.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir projeto.");
    } finally {
      setDeletingId("");
    }
  }

  useEffect(() => {
    const unsub = firebaseAuth.onAuthStateChanged((user) => {
      if (user) void load();
      else setLoading(false);
    });
    return unsub;
  }, []);

  const hasProjects = projects.length > 0;
  const latestUpdated = useMemo(() => projects[0]?.updatedAt || projects[0]?.createdAt || null, [projects]);

  return <>
    <section className="mt-7 rounded-[26px] border border-white/10 bg-white/[.02] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-violet-200">Biblioteca do Studio</p>
          <h2 className="mt-2 text-xl font-semibold">Projetos salvos</h2>
          <p className="mt-2 text-sm leading-6 text-white/45">Os projetos ficam persistidos com storyboard, versões, composição, marca do projeto e render final. Você também pode duplicar um projeto como modelo para acelerar novas produções.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold text-white/55 disabled:opacity-40"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}/> Atualizar</button>
          <a href="/interno/lab/studio/projetos/novo" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[.08] px-3 py-2.5 text-xs font-semibold text-cyan-100"><Plus className="h-3.5 w-3.5"/> Novo projeto</a>
        </div>
      </div>
      {latestUpdated && <p className="mt-3 text-[11px] text-white/25">Última atualização: {formatDate(latestUpdated)}</p>}
    </section>

    {loading && <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.02] p-5 text-sm text-white/45"><Loader2 className="h-4 w-4 animate-spin"/> Carregando projetos salvos...</div>}
    {error && <div className="mt-5 flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[.04] p-5 text-sm text-amber-50"><TriangleAlert className="h-5 w-5 shrink-0"/>{error}</div>}

    {!loading && !error && hasProjects && <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => <article key={project.id} className="group rounded-[24px] border border-white/10 bg-white/[.025] p-5 transition hover:border-cyan-300/25 hover:bg-cyan-300/[.035]">
        <div className="flex items-start justify-between gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.06]"><Clapperboard className="h-5 w-5 text-cyan-200"/></div>
          <span className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1 text-[10px] uppercase tracking-[.1em] text-white/45">{statusLabel[project.status] || project.status}</span>
        </div>
        <h3 className="mt-4 line-clamp-2 text-lg font-semibold">{project.name}</h3>
        <p className="mt-2 text-xs text-white/40">{project.destination} · {project.aspectRatio}{project.durationSeconds ? ` · ${project.durationSeconds}s` : ""}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-white/35">
          <span>{project.sceneCount} cena{project.sceneCount === 1 ? "" : "s"}</span>
          <span className="text-right">{project.visualStyle}</span>
          <span>Geração: {project.generationState}</span>
          <span className="text-right">Render: {project.finalRenderState || "—"}</span>
        </div>
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between gap-3 text-xs text-white/35"><span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5"/>{formatDate(project.updatedAt || project.createdAt)}</span><a href={`/interno/lab/studio/projetos/${project.id}`} className="inline-flex items-center gap-1 font-semibold text-cyan-100 transition group-hover:translate-x-0.5">Abrir <ArrowRight className="h-3.5 w-3.5"/></a></div>
          <div className="mt-3 flex flex-wrap gap-2"><a href={`/interno/lab/studio/projetos/${project.id}/voz`} className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/15 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-100/80 transition hover:bg-cyan-300/[.05]"><Mic2 className="h-3.5 w-3.5"/> Direção de voz</a><button onClick={()=>renameProject(project)} disabled={renamingId===project.id} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white/60 transition hover:bg-white/[.04] disabled:opacity-40">{renamingId===project.id?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Pencil className="h-3.5 w-3.5"/>} Renomear</button><button onClick={()=>duplicateProject(project)} disabled={duplicatingId===project.id} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300/15 px-2.5 py-1.5 text-[11px] font-semibold text-violet-100/80 transition hover:bg-violet-300/[.05] disabled:opacity-40">{duplicatingId===project.id?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Copy className="h-3.5 w-3.5"/>} Duplicar como modelo</button><button onClick={()=>remove(project)} disabled={deletingId===project.id} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300/15 px-2.5 py-1.5 text-[11px] font-semibold text-rose-100/75 transition hover:bg-rose-300/[.06] disabled:opacity-40">{deletingId===project.id?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Trash2 className="h-3.5 w-3.5"/>} Excluir</button></div>
        </div>
      </article>)}
    </section>}

    {!loading && !error && !hasProjects && <section className="mt-5 rounded-[28px] border border-amber-300/15 bg-amber-300/[.025] p-6">
      <div className="flex gap-3"><FolderOpen className="mt-0.5 h-5 w-5 text-amber-100"/><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-amber-100">Nenhum projeto salvo</p><h2 className="mt-2 text-xl font-semibold">Crie o primeiro projeto do Studio</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">Assim que um projeto for criado, ele aparecerá automaticamente aqui para ser reaberto depois.</p></div></div>
      <a href="/interno/lab/studio/projetos/novo" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-100">Criar projeto <ArrowRight className="h-4 w-4"/></a>
    </section>}
  </>;
}
