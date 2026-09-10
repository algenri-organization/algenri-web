"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, CheckCircle2, Loader2 } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";
import type { StudioCommercialLink, StudioProjectOrigin } from "@/lib/studio/projects";

type Client = { id:string; tradeName?:string; legalName?:string };
type Project = { id:string; clientId:string; name:string; status:string };
type Proposal = { id:string; projectId:string; proposalNumber:string; title:string; status:string };
type Contract = { id:string; projectId:string; proposalId:string; contractNumber:string; title:string; status:string };

async function authJson(url:string) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Sessão não encontrada.");
  const token = await user.getIdToken();
  const response = await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
  const payload = await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(payload.error||"Falha ao carregar contexto comercial.");
  return payload;
}

export default function StudioCommercialLinkSelector({value,onChange}:{value:StudioCommercialLink;onChange:(value:StudioCommercialLink)=>void}) {
  const [origin,setOrigin]=useState<StudioProjectOrigin>(value.origin);
  const [clients,setClients]=useState<Client[]>([]);
  const [projects,setProjects]=useState<Project[]>([]);
  const [proposals,setProposals]=useState<Proposal[]>([]);
  const [contracts,setContracts]=useState<Contract[]>([]);
  const [loading,setLoading]=useState(false);

  useEffect(()=>{ if(origin!=="client") return; setLoading(true); authJson("/api/internal/clients").then(p=>setClients(p.clients||[])).finally(()=>setLoading(false)); },[origin]);
  useEffect(()=>{ if(!value.clientId){setProjects([]);return;} authJson(`/api/internal/projects?clientId=${encodeURIComponent(value.clientId)}`).then(p=>setProjects(p.projects||[])); },[value.clientId]);
  useEffect(()=>{ if(!value.commercialProjectId){setProposals([]);setContracts([]);return;} Promise.all([authJson(`/api/internal/proposals?projectId=${encodeURIComponent(value.commercialProjectId)}`),authJson(`/api/internal/contracts?projectId=${encodeURIComponent(value.commercialProjectId)}`)]).then(([p,c])=>{setProposals(p.proposals||[]);setContracts(c.contracts||[]);}); },[value.commercialProjectId]);

  const filteredContracts=useMemo(()=>value.proposalId?contracts.filter(c=>c.proposalId===value.proposalId):contracts,[contracts,value.proposalId]);
  const selectClass="mt-2 w-full rounded-xl border border-white/10 bg-[#081522] px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/25";

  function chooseOrigin(next:StudioProjectOrigin){setOrigin(next);onChange({origin:next});}
  return <section className="rounded-[26px] border border-cyan-300/15 bg-cyan-300/[.025] p-5">
    <div className="flex items-center gap-2"><BriefcaseBusiness className="h-5 w-5 text-cyan-200"/><h2 className="font-semibold">Origem e vínculo comercial</h2></div>
    <p className="mt-2 text-sm leading-6 text-white/45">Conteúdo interno da ALGENRI fica independente. Para cliente, o Studio herda o contexto da cadeia Cliente → Projeto → Proposta → Contrato.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={()=>chooseOrigin("internal")} className={`rounded-2xl border p-4 text-left ${origin==="internal"?"border-cyan-300/25 bg-cyan-300/[.06]":"border-white/10"}`}><div className="flex justify-between"><span className="font-semibold">ALGENRI interna</span>{origin==="internal"&&<CheckCircle2 className="h-4 w-4 text-cyan-200"/>}</div><p className="mt-1 text-xs text-white/35">Marca, testes, comunicação própria e ativos internos.</p></button>
      <button type="button" onClick={()=>chooseOrigin("client")} className={`rounded-2xl border p-4 text-left ${origin==="client"?"border-violet-300/25 bg-violet-300/[.06]":"border-white/10"}`}><div className="flex justify-between"><span className="font-semibold">Projeto de cliente</span>{origin==="client"&&<CheckCircle2 className="h-4 w-4 text-violet-200"/>}</div><p className="mt-1 text-xs text-white/35">Relaciona a criação ao funil comercial existente.</p></button>
    </div>
    {origin==="client"&&<div className="mt-5 grid gap-4 md:grid-cols-2">
      <label className="text-xs text-white/60">Cliente{loading&&<Loader2 className="ml-2 inline h-3 w-3 animate-spin"/>}<select className={selectClass} value={value.clientId||""} onChange={e=>onChange({origin:"client",clientId:e.target.value||undefined})}><option value="">Selecione o cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.tradeName||c.legalName||c.id}</option>)}</select></label>
      <label className="text-xs text-white/60">Projeto comercial<select className={selectClass} value={value.commercialProjectId||""} disabled={!value.clientId} onChange={e=>onChange({...value,origin:"client",commercialProjectId:e.target.value||undefined,proposalId:undefined,contractId:undefined})}><option value="">Selecione o projeto</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name} · {p.status}</option>)}</select></label>
      <label className="text-xs text-white/60">Proposta<select className={selectClass} value={value.proposalId||""} disabled={!value.commercialProjectId} onChange={e=>onChange({...value,origin:"client",proposalId:e.target.value||undefined,contractId:undefined})}><option value="">Opcional</option>{proposals.map(p=><option key={p.id} value={p.id}>{p.proposalNumber} · {p.title} · {p.status}</option>)}</select></label>
      <label className="text-xs text-white/60">Contrato<select className={selectClass} value={value.contractId||""} disabled={!value.commercialProjectId} onChange={e=>onChange({...value,origin:"client",contractId:e.target.value||undefined})}><option value="">Opcional</option>{filteredContracts.map(c=><option key={c.id} value={c.id}>{c.contractNumber} · {c.title} · {c.status}</option>)}</select></label>
    </div>}
  </section>;
}
