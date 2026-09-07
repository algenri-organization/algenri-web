"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowRight, FileSignature } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Proposal = { id:string; projectId:string; proposalNumber:string; version:string; clientName:string; projectName:string; status:string };
type Contract = { id:string; proposalId:string; contractNumber:string; status:string };

async function authFetch(user:User,url:string,init?:RequestInit){
  const token=await user.getIdToken();
  return fetch(url,{...init,headers:{...(init?.headers??{}),Authorization:`Bearer ${token}`}});
}

export default function ProposalToContractAction({id}:{id:string}){
  const [user,setUser]=useState<User|null>(null);
  const [proposal,setProposal]=useState<Proposal|null>(null);
  const [contract,setContract]=useState<Contract|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  useEffect(()=>onAuthStateChanged(firebaseAuth,setUser),[]);
  useEffect(()=>{
    if(!user)return;
    (async()=>{
      const pr=await authFetch(user,`/api/internal/proposals/${id}`);
      const pp=await pr.json();
      if(!pr.ok)return;
      const current=pp.proposal as Proposal;
      setProposal(current);
      if(current.status!=="approved")return;
      const cr=await authFetch(user,`/api/internal/contracts?projectId=${encodeURIComponent(current.projectId)}`);
      const cp=await cr.json();
      if(cr.ok)setContract((cp.contracts||[]).find((item:Contract)=>item.proposalId===current.id&&item.status!=="cancelled")||null);
    })().catch(()=>setMessage("Não foi possível verificar a contratação desta proposta."));
  },[user,id]);

  async function continueToContract(){
    if(!user||!proposal||busy)return;
    if(contract){window.location.href=`/interno/contratos/${contract.id}`;return;}
    setBusy(true);setMessage("");
    const response=await authFetch(user,"/api/internal/contracts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({proposalId:proposal.id})});
    const payload=await response.json();
    setBusy(false);
    if(!response.ok){setMessage(payload.error==="proposal_not_approved"?"A proposta precisa estar aprovada antes de seguir para contrato.":"Não foi possível criar o contrato.");return;}
    window.location.href=`/interno/contratos/${payload.contract.id}`;
  }

  if(!proposal||proposal.status!=="approved")return null;
  return <div className="mx-auto -mt-2 mb-8 max-w-5xl px-6">
    <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[.05] p-5 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3"><FileSignature className="mt-0.5 h-5 w-5 text-emerald-200"/><div><p className="font-semibold">Proposta aprovada — próxima etapa: contrato</p><p className="mt-1 text-sm leading-6 text-white/50">O contrato será vinculado automaticamente à proposta {proposal.proposalNumber} v{proposal.version}, ao cliente e ao projeto.</p></div></div>
        <button onClick={continueToContract} disabled={busy} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50">{busy?"Criando contrato…":contract?"Abrir contrato":"Seguir para Contrato"}<ArrowRight size={16}/></button>
      </div>{message&&<p className="mt-3 text-sm text-amber-100">{message}</p>}
    </section>
  </div>;
}
