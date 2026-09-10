"use client";

import { useState } from "react";
import { CheckCircle2, Film, Loader2, ShieldCheck } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type FinalRender={state:string;format:"mp4";aspectRatio:string;transition:string;totalDurationSeconds:number;preparedAt:string;renderEngine:string;outputUrl?:string|null};

export default function StudioFinalRenderPanel({projectId,composition,initialFinalRender}:{projectId:string;composition?:{state?:string}|null;initialFinalRender?:FinalRender|null}){
  const [manifest,setManifest]=useState<FinalRender|null>(initialFinalRender??null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const approved=composition?.state==="approved";

  async function token(){const user=firebaseAuth.currentUser;if(!user)throw new Error("Sessão não encontrada.");return user.getIdToken();}
  async function prepare(){setBusy(true);setError("");try{const response=await fetch(`/api/internal/studio/projects/${projectId}/final-render`,{method:"POST",headers:{Authorization:`Bearer ${await token()}`}});const payload=await response.json().catch(()=>({}));if(!response.ok||!payload.manifest)throw new Error(payload.error||"Não foi possível preparar a montagem final.");setManifest(payload.manifest);}catch(e){setError(e instanceof Error?e.message:"Falha ao preparar montagem final.");}finally{setBusy(false);}}

  return <section className={`mt-8 rounded-[28px] border p-5 sm:p-6 ${approved?"border-violet-300/15 bg-violet-300/[.025]":"border-white/10 bg-white/[.02]"}`}>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="flex gap-3"><Film className={`mt-0.5 h-5 w-5 ${approved?"text-violet-100":"text-white/35"}`}/><div><h2 className="text-lg font-semibold">Montagem final</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">Consolida as versões ativas, a ordem das cenas, as camadas exatas e a transição aprovada em um manifesto único de renderização. Nenhum novo crédito de IA é consumido nesta preparação.</p></div></div>{manifest&&<span className="self-start rounded-full bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100">Manifesto preparado</span>}</div>

    {!approved&&<div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-white/40">Aprove primeiro a composição controlada para liberar a montagem final.</div>}
    {error&&<div className="mt-5 rounded-2xl border border-rose-300/15 bg-rose-300/[.03] p-4 text-sm text-rose-100">{error}</div>}

    {manifest&&<div className="mt-5 grid gap-3 sm:grid-cols-4"><div className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Formato</p><p className="mt-2 font-semibold">MP4</p></div><div className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Proporção</p><p className="mt-2 font-semibold">{manifest.aspectRatio}</p></div><div className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Duração</p><p className="mt-2 font-semibold">{manifest.totalDurationSeconds}s</p></div><div className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Transição</p><p className="mt-2 font-semibold">{manifest.transition==="fade"?"Fade":"Corte"}</p></div></div>}

    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-2 text-xs leading-5 text-white/35"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0"/><span>Esta etapa congela as decisões criativas antes de conectar o motor de renderização MP4.</span></div><button onClick={prepare} disabled={!approved||busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-300/20 bg-violet-300/[.07] px-4 py-2.5 text-xs font-semibold text-violet-100 disabled:cursor-not-allowed disabled:opacity-30">{busy?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:manifest?<CheckCircle2 className="h-3.5 w-3.5"/>:<Film className="h-3.5 w-3.5"/>}{manifest?"Repreparar montagem":"Preparar montagem final"}</button></div>
  </section>;
}
