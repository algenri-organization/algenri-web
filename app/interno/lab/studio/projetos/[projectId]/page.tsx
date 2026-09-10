"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, Film, Loader2, Pencil, RefreshCw, Save, Sparkles, TriangleAlert } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";
import StudioRoutingPanel from "@/components/studio/studio-routing-panel";

type Scene = { index:number; title:string; durationSeconds:number; objective:string; narration:string; visualDirection:string; technicalPrompt:string; status:"draft"|"approved" };
type Project = { id:string; name:string; status:string; briefing?:{ destination?:string; durationSeconds?:number; visualStyle?:string; aspectRatio?:string; engineMode?:string; priority?:string }; storyboard?:Scene[]; commercialLink?:{ origin?:string; clientName?:string; commercialProjectName?:string; proposalNumber?:string; contractNumber?:string }; ai?:{ storyboardState?:string; model?:string }; review?:{ approvedScenes?:number; totalScenes?:number; allApproved?:boolean }; routing?:any };

export default function StudioProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const [projectId,setProjectId]=useState("");
  const [project,setProject]=useState<Project|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [editing,setEditing]=useState<number|null>(null);
  const [draft,setDraft]=useState<Scene|null>(null);
  const [busy,setBusy]=useState("");
  const [instruction,setInstruction]=useState("");

  useEffect(()=>{let active=true;params.then(({projectId})=>active&&setProjectId(projectId));return()=>{active=false}},[params]);

  async function token(){const user=firebaseAuth.currentUser;if(!user)throw new Error("Sessão não encontrada.");return user.getIdToken();}
  async function reload(){if(!projectId)return;setLoading(true);setError("");try{const response=await fetch(`/api/internal/studio/projects/${projectId}`,{headers:{Authorization:`Bearer ${await token()}`},cache:"no-store"});const payload=await response.json().catch(()=>({}));if(!response.ok||!payload.project)throw new Error(payload.error||"Não foi possível carregar o projeto.");setProject(payload.project);}catch(err){setError(err instanceof Error?err.message:"Não foi possível carregar o projeto.");}finally{setLoading(false)}}
  useEffect(()=>{if(!projectId)return;const unsub=firebaseAuth.onAuthStateChanged(()=>reload());return unsub;},[projectId]);

  async function patch(body:Record<string,unknown>){const response=await fetch(`/api/internal/studio/projects/${projectId}/storyboard`,{method:"PATCH",headers:{Authorization:`Bearer ${await token()}`,"Content-Type":"application/json"},body:JSON.stringify(body)});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"Não foi possível atualizar o storyboard.");return payload;}
  async function saveScene(){if(!draft)return;setBusy(`save-${draft.index}`);setError("");try{await patch({action:"update_scene",sceneIndex:draft.index,patch:{title:draft.title,durationSeconds:draft.durationSeconds,objective:draft.objective,narration:draft.narration,visualDirection:draft.visualDirection,technicalPrompt:draft.technicalPrompt,status:"draft"}});setEditing(null);setDraft(null);await reload();}catch(e){setError(e instanceof Error?e.message:"Falha ao salvar cena.");}finally{setBusy("")}}
  async function approveScene(scene:Scene){setBusy(`approve-${scene.index}`);try{await patch({action:"update_scene",sceneIndex:scene.index,patch:{status:scene.status==="approved"?"draft":"approved"}});await reload();}catch(e){setError(e instanceof Error?e.message:"Falha ao aprovar cena.");}finally{setBusy("")}}
  async function regenerate(scene:Scene){setBusy(`regen-${scene.index}`);try{await patch({action:"regenerate_scene",sceneIndex:scene.index,instructions:instruction||undefined});setInstruction("");await reload();}catch(e){setError(e instanceof Error?e.message:"Falha ao regenerar cena.");}finally{setBusy("")}}
  async function approveAll(){setBusy("all");try{await patch({action:"approve_all"});await reload();}catch(e){setError(e instanceof Error?e.message:"Falha ao aprovar storyboard.");}finally{setBusy("")}}

  const approved=project?.storyboard?.filter(s=>s.status==="approved").length??0;
  const total=project?.storyboard?.length??0;
  const allApproved=approved===total&&total>0;

  return <main className="min-h-screen bg-[#040c17] px-5 pb-24 pt-24 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <a href="/interno/lab/studio/projetos" className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white"><ArrowLeft className="h-4 w-4"/> Voltar aos projetos</a>
    {loading&&<div className="mt-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.02] p-5 text-sm text-white/50"><Loader2 className="h-4 w-4 animate-spin"/> Carregando projeto...</div>}
    {error&&<div className="mt-6 flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[.04] p-5"><TriangleAlert className="h-5 w-5 text-amber-100"/><p className="text-sm text-amber-50">{error}</p></div>}

    {project&&<>
      <div className="mt-5 border-b border-white/10 pb-7"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-200"><Film className="h-4 w-4"/> ALGENRI Studio · Storyboard</div><h1 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">{project.name}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Revise cada cena, edite manualmente, peça uma nova versão à IA e aprove somente quando estiver pronta. Nenhuma geração de vídeo é disparada aqui.</p></div>

      {project.commercialLink?.origin==="client"&&<section className="mt-6 rounded-[22px] border border-sky-300/15 bg-sky-300/[.025] p-4"><p className="text-[10px] uppercase tracking-[.14em] text-sky-200/70">Vínculo comercial</p><p className="mt-2 text-sm text-white/65">{[project.commercialLink.clientName,project.commercialLink.commercialProjectName,project.commercialLink.proposalNumber,project.commercialLink.contractNumber].filter(Boolean).join(" · ")}</p></section>}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">{[["Status",project.status],["Destino",project.briefing?.destination||"—"],["Duração",project.briefing?.durationSeconds?`${project.briefing.durationSeconds}s`:"—"],["Estilo",project.briefing?.visualStyle||"—"],["IA",project.ai?.storyboardState||"—"],["Aprovação",`${approved}/${total}`]].map(([label,value])=><div key={label} className="rounded-2xl border border-white/10 bg-white/[.02] p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">{label}</p><p className="mt-2 text-sm font-semibold text-white/70">{value}</p></div>)}</section>

      <section className="mt-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-violet-200"/><h2 className="text-xl font-semibold">Storyboard por cenas</h2></div><p className="mt-2 text-sm text-white/40">Aprovação cena a cena antes do roteamento para os motores.</p></div><button onClick={approveAll} disabled={!total||busy==="all"} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[.06] px-4 py-3 text-sm font-semibold text-emerald-100 disabled:opacity-40">{busy==="all"?<Loader2 className="h-4 w-4 animate-spin"/>:<CheckCircle2 className="h-4 w-4"/>} Aprovar storyboard completo</button></div>

        <div className="mt-5 space-y-4">{(project.storyboard||[]).map(scene=>{const isEditing=editing===scene.index;const s=isEditing&&draft?draft:scene;return <article key={scene.index} className={`rounded-[26px] border p-5 ${scene.status==="approved"?"border-emerald-300/20 bg-emerald-300/[.025]":"border-white/10 bg-white/[.02]"}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs uppercase tracking-[.12em] text-cyan-200/70">Cena {scene.index}</p>{isEditing?<input value={s.title} onChange={e=>setDraft({...s,title:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-lg font-semibold outline-none"/>:<h3 className="mt-1 text-lg font-semibold">{scene.title}</h3>}</div><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-white/45"><Clock3 className="h-3.5 w-3.5"/>{scene.durationSeconds}s</span><span className={`rounded-full px-3 py-1.5 text-xs ${scene.status==="approved"?"bg-emerald-300/10 text-emerald-100":"bg-white/[.04] text-white/40"}`}>{scene.status==="approved"?"Aprovada":"Em revisão"}</span></div></div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">{[["Objetivo","objective"],["Locução","narration"],["Direção visual","visualDirection"],["Prompt técnico","technicalPrompt"]].map(([label,key])=><div key={key} className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">{label}</p>{isEditing?<textarea rows={key==="technicalPrompt"?6:4} value={String((s as any)[key]||"")} onChange={e=>setDraft({...s,[key]:e.target.value})} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm leading-6 outline-none"/>:<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/60">{(scene as any)[key]}</p>}</div>)}</div>

          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="flex flex-wrap gap-2">{isEditing?<><button onClick={saveScene} disabled={busy===`save-${scene.index}`} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[.06] px-3 py-2 text-xs font-semibold text-cyan-100"><Save className="h-3.5 w-3.5"/> Salvar alterações</button><button onClick={()=>{setEditing(null);setDraft(null)}} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/50">Cancelar</button></>:<button onClick={()=>{setEditing(scene.index);setDraft({...scene})}} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60"><Pencil className="h-3.5 w-3.5"/> Editar</button>}<button onClick={()=>approveScene(scene)} disabled={busy===`approve-${scene.index}`} className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[.04] px-3 py-2 text-xs font-semibold text-emerald-100"><CheckCircle2 className="h-3.5 w-3.5"/> {scene.status==="approved"?"Reabrir":"Aprovar cena"}</button></div>
            <div className="flex min-w-0 flex-1 gap-2 xl:max-w-xl"><input value={instruction} onChange={e=>setInstruction(e.target.value)} placeholder="Opcional: diga à IA o que melhorar nesta cena" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs outline-none placeholder:text-white/20"/><button onClick={()=>regenerate(scene)} disabled={busy===`regen-${scene.index}`} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-300/[.05] px-3 py-2 text-xs font-semibold text-violet-100">{busy===`regen-${scene.index}`?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<RefreshCw className="h-3.5 w-3.5"/>} Regenerar IA</button></div></div>
        </article>})}</div>
      </section>

      <section className={`mt-8 rounded-[26px] border p-5 ${allApproved?"border-emerald-300/20 bg-emerald-300/[.035]":"border-white/10 bg-white/[.02]"}`}><div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-200"/><div><h2 className="font-semibold">{allApproved?"Storyboard aprovado para roteamento":"Revisão criativa em andamento"}</h2><p className="mt-2 text-sm leading-6 text-white/45">{allApproved?"Todas as cenas estão aprovadas. O Studio já pode calcular o melhor motor e o custo estimado por cena antes de qualquer geração paga.":"Edite, regenere ou aprove as cenas individualmente. O Studio mantém o histórico do projeto sem gastar créditos de vídeo."}</p></div></div></section>

      <StudioRoutingPanel projectId={projectId} allApproved={allApproved} initialRouting={project.routing} />
    </>}
  </div></main>;
}
