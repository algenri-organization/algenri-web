"use client";

import { useState } from "react";
import { CheckCircle2, CircleAlert, Loader2, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Check={id:string;label:string;level:"error"|"warning"|"ok";detail:string};
type Report={ready:boolean;checkedAt:string;errors:number;warnings:number;checks:Check[]};

export default function StudioPreflightPanel({projectId,enabled,onReadyChange}:{projectId:string;enabled:boolean;onReadyChange?:(ready:boolean)=>void}){
  const[report,setReport]=useState<Report|null>(null);const[busy,setBusy]=useState(false);const[error,setError]=useState("");
  async function token(){const user=firebaseAuth.currentUser;if(!user)throw new Error("Sessão não encontrada.");return user.getIdToken();}
  async function run(){if(!enabled)return;setBusy(true);setError("");try{const response=await fetch(`/api/internal/studio/projects/${projectId}/preflight`,{headers:{Authorization:`Bearer ${await token()}`},cache:"no-store"});const payload=await response.json().catch(()=>({}));if(!response.ok||!payload.report)throw new Error(payload.error||"Não foi possível executar o controle de qualidade.");setReport(payload.report);onReadyChange?.(payload.report.ready);}catch(e){setError(e instanceof Error?e.message:"Falha no controle de qualidade.");onReadyChange?.(false);}finally{setBusy(false);}}
  if(!enabled)return null;
  return <section className="mt-8 rounded-[28px] border border-amber-300/15 bg-amber-300/[.025] p-5 sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-amber-100"/><div><h2 className="text-lg font-semibold">Controle de qualidade antes da entrega</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">Valida storyboard, cenas ativas, arquivamento, composição, marca, continuidade e camadas antes da montagem final. Alertas permitem revisão; erros bloqueiam a renderização.</p></div></div><button onClick={run} disabled={busy} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[.06] px-4 py-2.5 text-xs font-semibold text-amber-50 disabled:opacity-40">{busy?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<RefreshCw className="h-3.5 w-3.5"/>}{report?"Verificar novamente":"Executar verificação"}</button></div>
    {error&&<div className="mt-4 rounded-2xl border border-rose-300/15 bg-rose-300/[.04] p-4 text-sm text-rose-100">{error}</div>}
    {!report&&!error&&<div className="mt-5 rounded-2xl border border-white/8 bg-black/15 p-4 text-xs leading-5 text-white/35">Execute a verificação depois de aprovar a composição. Nenhum crédito de geração é consumido nesta etapa.</div>}
    {report&&<><div className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 ${report.ready?"border-emerald-300/20 bg-emerald-300/[.04]":"border-rose-300/20 bg-rose-300/[.04]"}`}>{report.ready?<CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-100"/>:<CircleAlert className="mt-0.5 h-5 w-5 text-rose-100"/>}<div><p className="text-sm font-semibold">{report.ready?"Projeto liberado para montagem final":"Há pendências obrigatórias"}</p><p className="mt-1 text-xs text-white/45">{report.errors} erro(s) · {report.warnings} alerta(s)</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{report.checks.map(check=><div key={check.id} className="rounded-2xl border border-white/8 bg-black/15 p-4"><div className="flex items-start gap-2">{check.level==="ok"?<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200"/>:check.level==="warning"?<TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-100"/>:<CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-100"/>}<div><p className="text-xs font-semibold text-white/70">{check.label}</p><p className="mt-1 text-[11px] leading-5 text-white/35">{check.detail}</p></div></div></div>)}</div></>}
  </section>;
}
