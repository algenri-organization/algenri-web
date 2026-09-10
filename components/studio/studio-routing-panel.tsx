"use client";

import { useState } from "react";
import { Bot, CheckCircle2, Coins, Loader2, Route, TriangleAlert } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type SceneRoute = {
  sceneIndex:number;
  sceneTitle:string;
  selectedProviderId:string;
  selectedProviderName:string;
  selectedModel:string|null;
  estimatedCredits:number|null;
  executable:boolean;
  reason:string;
  candidates:Array<{providerId:string;providerName:string;score:number;executable:boolean;reason:string}>;
};

type RoutingPlan = {
  state:string;
  generatedAt?:string;
  routes:SceneRoute[];
  totalEstimatedCredits:number|null;
  fullyExecutable:boolean;
  providerCoverage?:{active:string[];recommendedNext:string[];planned:string[]}|null;
};

export default function StudioRoutingPanel({projectId,allApproved,initialRouting}:{projectId:string;allApproved:boolean;initialRouting?:RoutingPlan|null}){
  const [routing,setRouting]=useState<RoutingPlan|null>(initialRouting?.routes?.length?initialRouting:null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function calculate(){
    setLoading(true);setError("");
    try{
      const user=firebaseAuth.currentUser;if(!user)throw new Error("Sessão não encontrada.");
      const response=await fetch(`/api/internal/studio/projects/${projectId}/routing`,{method:"POST",headers:{Authorization:`Bearer ${await user.getIdToken()}`}});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok||!payload.routing)throw new Error(payload.error||"Não foi possível calcular o roteamento.");
      setRouting(payload.routing);
    }catch(e){setError(e instanceof Error?e.message:"Não foi possível calcular o roteamento.");}
    finally{setLoading(false);}
  }

  return <section className="mt-8 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[.025] p-5 sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 text-cyan-100"><Route className="h-5 w-5"/><h2 className="text-lg font-semibold">Roteamento de motores & custo</h2></div><p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">Com o storyboard aprovado, o Studio compara os motores cadastrados, valida o Runway por dry run e calcula o custo por cena sem gerar mídia.</p></div><button onClick={calculate} disabled={!allApproved||loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[.08] px-4 py-3 text-sm font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-35">{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<Coins className="h-4 w-4"/>}{routing?"Recalcular rota":"Calcular motores e custo"}</button></div>

    {!allApproved&&<div className="mt-5 flex gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[.035] p-4"><TriangleAlert className="mt-0.5 h-4 w-4 text-amber-100"/><p className="text-sm text-white/50">Aprovação de todas as cenas é obrigatória antes da estimativa.</p></div>}
    {error&&<div className="mt-5 rounded-2xl border border-rose-300/15 bg-rose-300/[.03] p-4 text-sm text-rose-100">{error}</div>}

    {routing&&<div className="mt-6 space-y-4">
      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Custo estimado</p><p className="mt-2 text-lg font-semibold">{routing.totalEstimatedCredits===null?"Parcial":`${routing.totalEstimatedCredits} créditos`}</p></div><div className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Cobertura atual</p><p className="mt-2 text-lg font-semibold">Runway</p></div><div className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Pronto para gerar</p><p className="mt-2 text-lg font-semibold">{routing.fullyExecutable?"Sim":"Parcial"}</p></div></div>

      {routing.routes.map(route=><article key={route.sceneIndex} className="rounded-[22px] border border-white/10 bg-black/15 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] uppercase tracking-[.12em] text-cyan-200/60">Cena {route.sceneIndex}</p><h3 className="mt-1 font-semibold">{route.sceneTitle}</h3></div><div className="flex flex-wrap gap-2"><span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55">{route.selectedProviderName}</span>{route.selectedModel&&<span className="rounded-full border border-violet-300/15 bg-violet-300/[.04] px-3 py-1 text-xs text-violet-100">{route.selectedModel}</span>}<span className="rounded-full border border-emerald-300/15 bg-emerald-300/[.04] px-3 py-1 text-xs text-emerald-100">{route.estimatedCredits===null?"custo não disponível":`${route.estimatedCredits} créditos`}</span></div></div><p className="mt-3 text-xs leading-5 text-white/40">{route.reason}</p><div className="mt-3 flex flex-wrap gap-2">{route.candidates.map(candidate=><span key={candidate.providerId} className={`rounded-lg border px-2.5 py-1 text-[11px] ${candidate.executable?"border-emerald-300/15 text-emerald-100":"border-white/10 text-white/35"}`}>{candidate.providerName} · score {candidate.score}{candidate.executable?" · ativo":" · futuro"}</span>)}</div></article>)}

      <div className="rounded-2xl border border-violet-300/15 bg-violet-300/[.025] p-4"><div className="flex gap-3"><Bot className="mt-0.5 h-4 w-4 text-violet-200"/><div><p className="text-sm font-semibold">Próximas integrações recomendadas</p><p className="mt-2 text-xs leading-5 text-white/40"><strong className="text-white/65">HeyGen</strong> para avatar/voz, <strong className="text-white/65">Higgsfield</strong> como segundo motor visual e <strong className="text-white/65">Remotion</strong> para montagem, textos, logo e acabamento. Veo, Luma, Kling, Seedance e Kie.ai ficam preparados no catálogo, mas não precisam bloquear o primeiro fluxo produtivo.</p></div></div></div>

      {routing.fullyExecutable&&<div className="flex gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/[.035] p-4"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-100"/><p className="text-sm text-white/55">As cenas possuem rota executável. A próxima camada será a confirmação de orçamento e geração controlada cena a cena.</p></div>}
    </div>}
  </section>;
}
