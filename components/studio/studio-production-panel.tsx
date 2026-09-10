"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Coins, Download, Loader2, Play, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type RouteItem = { sceneIndex:number; sceneTitle:string; selectedProviderId:string; selectedProviderName:string; selectedModel:string|null; estimatedCredits:number|null; executable:boolean };
type SceneJob = { sceneIndex:number; provider:string; model:string|null; taskId:string; status:"queued"|"running"|"succeeded"|"failed"; estimatedCredits:number|null; actualCredits:number|null; outputUrl:string|null; storagePath?:string|null; storageStatus?:"pending"|"archived"|"failed"|null; failure?:unknown|null };
type Routing = { routes:RouteItem[]; totalEstimatedCredits:number|null; fullyExecutable:boolean };
type Generation = { state?:string; actualCredits?:number|null; sceneJobs?:SceneJob[] };

export default function StudioProductionPanel({projectId,routing,budgetLimit,initialGeneration}:{projectId:string;routing?:Routing|null;budgetLimit?:number|null;initialGeneration?:Generation|null}){
  const [generation,setGeneration]=useState<Generation>(initialGeneration??{sceneJobs:[]});
  const [confirmed,setConfirmed]=useState(false);
  const [busy,setBusy]=useState("");
  const [error,setError]=useState("");

  const jobs=generation.sceneJobs??[];
  const jobByScene=useMemo(()=>new Map(jobs.map(job=>[job.sceneIndex,job])),[jobs]);
  const estimated=routing?.totalEstimatedCredits??null;
  const budgetExceeded=!!budgetLimit&&estimated!==null&&estimated>budgetLimit;

  async function token(){const user=firebaseAuth.currentUser;if(!user)throw new Error("Sessão não encontrada.");return user.getIdToken();}
  async function action(sceneIndex:number,kind:"start_scene"|"refresh_scene"){
    setBusy(`${kind}-${sceneIndex}`);setError("");
    try{
      const response=await fetch(`/api/internal/studio/projects/${projectId}/production`,{method:"POST",headers:{Authorization:`Bearer ${await token()}`,"Content-Type":"application/json"},body:JSON.stringify(kind==="start_scene"?{action:kind,sceneIndex,confirmSpend:true}:{action:kind,sceneIndex})});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok||!payload.job)throw new Error(payload.error||"Falha na produção da cena.");
      setGeneration(current=>({...current,sceneJobs:[...(current.sceneJobs??[]).filter(j=>j.sceneIndex!==sceneIndex),payload.job].sort((a,b)=>a.sceneIndex-b.sceneIndex)}));
    }catch(e){setError(e instanceof Error?e.message:"Falha na produção da cena.");}
    finally{setBusy("");}
  }

  async function downloadScene(sceneIndex:number){
    setBusy(`download-${sceneIndex}`);setError("");
    try{
      const response=await fetch(`/api/internal/studio/projects/${projectId}/assets/${sceneIndex}/download`,{headers:{Authorization:`Bearer ${await token()}`}});
      if(!response.ok){const payload=await response.json().catch(()=>({}));throw new Error(payload.error||"Não foi possível baixar o arquivo.");}
      const blob=await response.blob();
      const disposition=response.headers.get("content-disposition")||"";
      const match=disposition.match(/filename="?([^\"]+)"?/i);
      const filename=match?.[1]||`ALGENRI-Studio-Cena-${String(sceneIndex).padStart(2,"0")}.mp4`;
      const url=URL.createObjectURL(blob);
      const anchor=document.createElement("a");
      anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);
    }catch(e){setError(e instanceof Error?e.message:"Não foi possível baixar o arquivo.");}
    finally{setBusy("");}
  }

  if(!routing?.routes?.length)return null;

  return <section className="mt-8 rounded-[28px] border border-emerald-300/15 bg-emerald-300/[.025] p-5 sm:p-6">
    <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-200"/><div><h2 className="text-lg font-semibold">Produção controlada por cena</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">Nenhuma cena é gerada automaticamente. Confirme o orçamento e dispare somente as cenas aprovadas que desejar produzir. Quando concluída, a mídia é arquivada no Storage do projeto.</p></div></div>

    <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Estimativa total</p><p className="mt-2 text-lg font-semibold">{estimated===null?"Parcial":`${estimated} créditos`}</p></div><div className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Teto do projeto</p><p className="mt-2 text-lg font-semibold">{budgetLimit?`${budgetLimit} créditos`:"Sem teto definido"}</p></div><div className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Custo real registrado</p><p className="mt-2 text-lg font-semibold">{typeof generation.actualCredits==="number"?`${generation.actualCredits} créditos`:"Aguardando"}</p></div></div>

    {budgetExceeded&&<div className="mt-4 flex gap-3 rounded-2xl border border-rose-300/20 bg-rose-300/[.04] p-4"><TriangleAlert className="mt-0.5 h-4 w-4 text-rose-100"/><p className="text-sm text-rose-50">A estimativa ultrapassa o teto do projeto. A geração fica bloqueada até revisão do orçamento ou novo roteamento.</p></div>}
    {error&&<div className="mt-4 rounded-2xl border border-rose-300/15 bg-rose-300/[.03] p-4 text-sm text-rose-100">{error}</div>}

    <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/15 p-4"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} className="mt-1"/><span><strong className="text-sm text-white/75">Confirmo que revisei a estimativa de custo.</strong><span className="mt-1 block text-xs leading-5 text-white/35">A confirmação habilita os botões de geração, mas cada cena continua exigindo um clique separado. Não há regeneração automática.</span></span></label>

    <div className="mt-5 space-y-3">{routing.routes.map(route=>{const job=jobByScene.get(route.sceneIndex);const active=job&&["queued","running"].includes(job.status);return <article key={route.sceneIndex} className="rounded-[22px] border border-white/10 bg-black/15 p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] uppercase tracking-[.12em] text-emerald-200/60">Cena {route.sceneIndex}</p><h3 className="mt-1 font-semibold">{route.sceneTitle}</h3><p className="mt-2 text-xs text-white/40">{route.selectedProviderName}{route.selectedModel?` · ${route.selectedModel}`:""} · {route.estimatedCredits===null?"custo não disponível":`${route.estimatedCredits} créditos estimados`}</p>{job&&<p className="mt-2 text-xs text-white/45">Job {job.taskId} · <span className={job.status==="succeeded"?"text-emerald-200":job.status==="failed"?"text-rose-200":"text-amber-100"}>{job.status}</span>{job.storageStatus==="archived"&&<span className="text-cyan-200"> · arquivado</span>}{job.storageStatus==="failed"&&<span className="text-amber-100"> · arquivo pendente</span>}</p>}</div><div className="flex flex-wrap gap-2">{!job&&<button onClick={()=>action(route.sceneIndex,"start_scene")} disabled={!confirmed||budgetExceeded||!route.executable||busy===`start_scene-${route.sceneIndex}`} className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[.07] px-4 py-2.5 text-xs font-semibold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-30">{busy===`start_scene-${route.sceneIndex}`?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Play className="h-3.5 w-3.5"/>} Gerar esta cena</button>}{job&&job.status!=="succeeded"&&<button onClick={()=>action(route.sceneIndex,"refresh_scene")} disabled={busy===`refresh_scene-${route.sceneIndex}`} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[.05] px-4 py-2.5 text-xs font-semibold text-cyan-100">{busy===`refresh_scene-${route.sceneIndex}`?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<RefreshCw className="h-3.5 w-3.5"/>} Atualizar status</button>}{job?.status==="succeeded"&&job.outputUrl&&<a href={job.outputUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[.07] px-4 py-2.5 text-xs font-semibold text-emerald-100"><CheckCircle2 className="h-3.5 w-3.5"/> Visualizar</a>}{job?.status==="succeeded"&&job.storagePath&&<button onClick={()=>downloadScene(route.sceneIndex)} disabled={busy===`download-${route.sceneIndex}`} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[.06] px-4 py-2.5 text-xs font-semibold text-cyan-100">{busy===`download-${route.sceneIndex}`?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Download className="h-3.5 w-3.5"/>} Baixar MP4</button>}</div></div>{active&&<div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5"><div className="h-full w-1/2 animate-pulse rounded-full bg-white/30"/></div>}</article>})}</div>

    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.025] p-4"><Coins className="mt-0.5 h-4 w-4 text-cyan-100"/><p className="text-xs leading-5 text-white/40">Resultados concluídos passam a ter duas camadas: URL original do provider para visualização imediata e cópia permanente no Storage da ALGENRI para download autenticado e uso futuro no projeto.</p></div>
  </section>;
}
