"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowDown, ArrowRight, ArrowUp, FilePlus2, Save, Sparkles } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Briefing = { id:string; clientName:string; projectName:string; status:string; templateVersion:string };
type Section = { id:string; key:string; title:string; content:string; order:number; source:string; editable:boolean };
type Dossier = { id:string; clientId:string; projectId:string; clientName:string; projectName:string; projectType:string; sourceBriefingVersion:string; status:string; version:string; title:string; sections:Section[]; updatedAt:string; aiMetadata?:{generatedAt:string;generatedBy:string;model:string;source:string}|null };

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(input, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } });
}

const statusLabel: Record<string,string> = { draft:"Rascunho", in_analysis:"Em análise", review_ready:"Pronto para revisão", finalized:"Finalizado", archived:"Arquivado" };
const aiErrorLabel: Record<string,string> = {
  ai_not_configured:"A geração por IA ainda não está configurada no ambiente.",
  ai_invalid_credentials:"A credencial da IA precisa ser revisada.",
  ai_insufficient_quota:"A conta de IA está sem saldo ou limite disponível.",
  ai_rate_limited:"A IA atingiu o limite temporário de requisições. Tente novamente em instantes.",
  ai_model_unavailable:"O modelo configurado para a IA não está disponível.",
  ai_provider_unavailable:"O serviço de IA está temporariamente indisponível.",
  ai_provider_unreachable:"Não foi possível conectar ao serviço de IA.",
  ai_schema_rejected:"A IA não aceitou o formato estruturado solicitado.",
  ai_empty_response:"A IA retornou uma resposta vazia.",
  ai_invalid_response:"A IA retornou uma resposta que não pôde ser interpretada.",
  dossier_locked:"O dossiê finalizado não pode ser sobrescrito pela IA.",
};

export default function DossierAdmin() {
  const [user,setUser]=useState<User|null>(null); const [ready,setReady]=useState(false);
  const [briefings,setBriefings]=useState<Briefing[]>([]); const [dossiers,setDossiers]=useState<Dossier[]>([]);
  const [selected,setSelected]=useState<Dossier|null>(null); const [briefingId,setBriefingId]=useState(""); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false); const [aiBusy,setAiBusy]=useState(false); const [proposalBusy,setProposalBusy]=useState(false);

  useEffect(()=>onAuthStateChanged(firebaseAuth,u=>{setUser(u);setReady(true)}),[]);
  async function load(u=user){ if(!u)return; const [d,b]=await Promise.all([authFetch(u,"/api/internal/dossiers"),authFetch(u,"/api/internal/briefing/instances")]); const dp=await d.json(); const bp=await b.json(); if(!d.ok||!b.ok) throw new Error("Não foi possível carregar os dossiês."); setDossiers(dp.dossiers??[]); setBriefings((bp.instances??[]).filter((x:Briefing)=>x.status==="completed")); }
  useEffect(()=>{ if(user) load(user).catch(e=>setMessage(e.message)); },[user]);

  async function generateAi(dossier:Dossier, silent=false){
    if(!user||aiBusy)return dossier;
    setAiBusy(true); if(!silent)setMessage("");
    try{
      const r=await authFetch(user,`/api/internal/dossiers/${dossier.id}/generate-ai`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({})});
      const p=await r.json();
      if(!r.ok) throw new Error(aiErrorLabel[p.error]||"Não foi possível elaborar o dossiê com IA.");
      setSelected(p.dossier); await load(user); setMessage("Análise por IA concluída. Revise o conteúdo antes de finalizar o dossiê."); return p.dossier as Dossier;
    }catch(e){setMessage(e instanceof Error?e.message:"Falha na análise por IA.");return dossier}finally{setAiBusy(false)}
  }

  async function create(){
    if(!user||!briefingId||busy)return;
    setBusy(true);setMessage("");
    try{
      const r=await authFetch(user,"/api/internal/dossiers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({briefingInstanceId:briefingId})});
      const p=await r.json();
      if(!r.ok) throw new Error(p.error==="briefing_not_completed"?"O briefing precisa estar concluído.":"Não foi possível gerar o dossiê.");
      await load(user); setSelected(p.dossier);
      if(p.created){
        setMessage("Dossiê criado. A IA está analisando o briefing…");
        setBusy(false);
        await generateAi(p.dossier,true);
        return;
      }
      setMessage("Este briefing já possuía dossiê. O existente foi aberto.");
    }catch(e){setMessage(e instanceof Error?e.message:"Falha ao criar dossiê.")}finally{setBusy(false)}
  }

  async function open(id:string){ if(!user)return; const r=await authFetch(user,`/api/internal/dossiers/${id}`); const p=await r.json(); if(r.ok)setSelected(p.dossier); else setMessage("Não foi possível abrir o dossiê."); }
  function updateSection(index:number, patch:Partial<Section>){ if(!selected)return; const sections=[...selected.sections]; sections[index]={...sections[index],...patch,source:patch.content!==undefined?"manual":sections[index].source}; setSelected({...selected,sections}); }
  function move(index:number,dir:-1|1){ if(!selected)return; const to=index+dir;if(to<0||to>=selected.sections.length)return; const sections=[...selected.sections]; [sections[index],sections[to]]=[sections[to],sections[index]]; setSelected({...selected,sections}); }
  async function save(status?:string){ if(!user||!selected||busy)return null; setBusy(true);setMessage(""); try{ const r=await authFetch(user,`/api/internal/dossiers/${selected.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:selected.title,status:status??selected.status,sections:selected.sections})}); const p=await r.json(); if(!r.ok)throw new Error("Não foi possível salvar o dossiê."); setSelected(p.dossier); await load(user); setMessage(status==="finalized"?"Dossiê finalizado. Você já pode seguir para a proposta comercial.":"Dossiê salvo."); return p.dossier as Dossier; }catch(e){setMessage(e instanceof Error?e.message:"Falha ao salvar.");return null}finally{setBusy(false)} }

  async function createProposal(){
    if(!user||!selected||proposalBusy)return;
    setProposalBusy(true);setMessage("");
    try{
      let dossier=selected;
      if(dossier.status!=="finalized"){
        const finalized=await save("finalized");
        if(!finalized) return;
        dossier=finalized;
      }
      const r=await authFetch(user,"/api/internal/proposals",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:dossier.projectId,dossierId:dossier.id,validityDays:15})});
      const p=await r.json();
      if(!r.ok)throw new Error("Não foi possível criar a proposta comercial a partir deste dossiê.");
      window.location.href=`/interno/propostas/${p.proposal.id}`;
    }catch(e){setMessage(e instanceof Error?e.message:"Falha ao seguir para proposta.")}finally{setProposalBusy(false)}
  }

  if(!ready)return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Carregando…</main>;
  if(!user)return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Faça login em /interno.</main>;

  return <main className="min-h-screen bg-[#040c17] text-white px-6 pb-20 pt-28"><div className="mx-auto max-w-7xl">
    <div className="flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-semibold tracking-[.25em] text-cyan-300">ALGENRI CLIENT FLOW</p><h1 className="mt-2 text-3xl font-semibold">Dossiês de Projeto</h1><p className="mt-2 text-sm text-white/45">Transforme briefings concluídos em análise estruturada por IA, revise e siga diretamente para a proposta comercial.</p></div><a href="/interno" className="text-sm text-white/50">Voltar ao dashboard</a></div>

    <div className="mt-7 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.03] p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center"><div className="flex-1"><p className="text-sm font-medium">Gerar a partir de briefing concluído</p><p className="mt-1 text-xs text-white/40">Ao criar um novo dossiê, a IA analisa automaticamente as respostas e prepara as 13 seções para revisão humana.</p></div><select value={briefingId} onChange={e=>setBriefingId(e.target.value)} className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm"><option value="">Selecione o briefing</option>{briefings.map(b=><option key={b.id} value={b.id}>{b.clientName} — {b.projectName} — v{b.templateVersion}</option>)}</select><button onClick={create} disabled={!briefingId||busy||aiBusy} className="flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-40"><Sparkles size={16}/>{busy||aiBusy?"Gerando…":"Gerar Dossiê com IA"}</button></div></div>

    <div className="mt-7 grid gap-6 lg:grid-cols-[320px_1fr]"><aside className="space-y-3">{dossiers.map(d=><button key={d.id} onClick={()=>open(d.id)} className={`w-full rounded-2xl border p-4 text-left ${selected?.id===d.id?"border-cyan-300/35 bg-cyan-300/[.07]":"border-white/10 bg-white/[.025]"}`}><p className="font-medium">{d.clientName}</p><p className="mt-1 text-sm text-white/45">{d.projectName}</p><div className="mt-3 flex justify-between text-xs text-white/35"><span>{statusLabel[d.status]??d.status}</span><span>v{d.version}</span></div></button>)}{!dossiers.length&&<p className="text-sm text-white/40">Nenhum dossiê criado.</p>}</aside>

    <section className="rounded-3xl border border-white/10 bg-white/[.025] p-5 md:p-7">{selected?<><div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between"><div><input value={selected.title} onChange={e=>setSelected({...selected,title:e.target.value})} className="w-full bg-transparent text-2xl font-semibold outline-none"/><p className="mt-2 text-sm text-white/45">{selected.clientName} · {selected.projectName} · Briefing v{selected.sourceBriefingVersion}</p><p className="mt-1 text-xs text-cyan-200">{statusLabel[selected.status]??selected.status} · Dossiê v{selected.version}{selected.aiMetadata?` · IA ${selected.aiMetadata.model}`:""}</p></div><div className="flex flex-wrap gap-2"><button disabled={aiBusy||selected.status==="finalized"||selected.status==="archived"} onClick={()=>generateAi(selected)} className="flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/[.06] px-4 py-2.5 text-sm text-cyan-100 disabled:opacity-40"><Sparkles size={15}/>{aiBusy?"Analisando…":"Analisar com IA"}</button><button onClick={()=>save()} className="flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950"><Save size={15}/>Salvar</button><button onClick={()=>save("review_ready")} className="rounded-xl border border-violet-300/20 px-4 py-2.5 text-sm text-violet-100">Pronto para revisão</button><button onClick={()=>save("finalized")} className="rounded-xl border border-emerald-300/20 px-4 py-2.5 text-sm text-emerald-100">Finalizar</button></div></div>
      <div className="mt-6 space-y-4">{selected.sections.map((s,i)=><div key={s.id} className="rounded-2xl border border-white/8 bg-black/10 p-4"><div className="flex items-center gap-2"><input value={s.title} onChange={e=>updateSection(i,{title:e.target.value})} className="min-w-0 flex-1 bg-transparent font-medium outline-none"/><span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/30">{s.source==="ai"?"IA":s.source==="manual"?"Editado":"Base"}</span><button onClick={()=>move(i,-1)} className="p-1.5 text-white/40"><ArrowUp size={15}/></button><button onClick={()=>move(i,1)} className="p-1.5 text-white/40"><ArrowDown size={15}/></button></div><textarea value={s.content} onChange={e=>updateSection(i,{content:e.target.value})} placeholder="Inclua a análise desta seção…" className="mt-3 min-h-28 w-full resize-y rounded-xl border border-white/8 bg-[#07111d] p-3 text-sm leading-6 outline-none placeholder:text-white/20"/></div>)}</div>
      <div className="mt-7 rounded-2xl border border-emerald-300/20 bg-emerald-300/[.04] p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-semibold text-emerald-100">Próxima etapa: Proposta Comercial</p><p className="mt-1 text-xs leading-5 text-white/45">O dossiê será vinculado como fonte da proposta. Se ainda não estiver finalizado, o sistema finaliza o dossiê antes de criar a proposta.</p></div><button disabled={proposalBusy||busy||aiBusy} onClick={createProposal} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40">{proposalBusy?"Criando proposta…":"Seguir para Proposta Comercial"}<ArrowRight size={16}/></button></div></div>
      </>:<div className="grid min-h-[420px] place-items-center text-center text-white/35">Selecione ou gere um dossiê para começar.</div>}{message&&<p className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[.04] px-4 py-3 text-sm text-amber-100">{message}</p>}</section></div>
  </div></main>;
}
