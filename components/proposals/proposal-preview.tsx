"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowLeft, Printer } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Section = { id:string; key:string; title:string; content:string; order:number };
type Item = { id:string; description:string; quantity:number; unitValue:number; totalValue:number; billingType:"one_time"|"recurring"; recurrence:"monthly"|"annual"|"custom"|null; order:number };
type Proposal = {
  id:string; proposalNumber:string; version:string; clientName:string; projectName:string; status:string; title:string; summary:string;
  sections:Section[]; investmentItems:Item[]; subtotal:number; discountType:"none"|"fixed"|"percentage"; discountScope?:"one_time"|"all"; discountValue:number; total:number; recurringMonthly:number; recurringAnnual:number;
  paymentTerms:string; validityDate:string; commercialConditions:string; createdAt:string; updatedAt:string;
};

async function authFetch(user:User,url:string){const token=await user.getIdToken();return fetch(url,{headers:{Authorization:`Bearer ${token}`}})}
const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);
const date=(v:string)=>v?new Intl.DateTimeFormat("pt-BR").format(new Date(`${v}T12:00:00`)):"—";

export default function ProposalPreview({ id }: { id: string }) {
  const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[proposal,setProposal]=useState<Proposal|null>(null),[message,setMessage]=useState("");
  useEffect(()=>onAuthStateChanged(firebaseAuth,u=>{setUser(u);setReady(true)}),[]);
  useEffect(()=>{if(!user)return;authFetch(user,`/api/internal/proposals/${id}`).then(async r=>{const p=await r.json();if(!r.ok)throw new Error("Não foi possível abrir a proposta.");setProposal(p.proposal)}).catch(e=>setMessage(e.message))},[user,id]);
  useEffect(()=>{if(!proposal)return;const params=new URLSearchParams(window.location.search);if(params.get("print")==="1")setTimeout(()=>window.print(),500)},[proposal]);
  const oneTimeItems=useMemo(()=>proposal?.investmentItems.filter(i=>i.billingType==="one_time")??[],[proposal]);
  const recurringItems=useMemo(()=>proposal?.investmentItems.filter(i=>i.billingType==="recurring")??[],[proposal]);
  if(!ready)return <main className="min-h-screen grid place-items-center bg-slate-100 text-slate-700">Carregando…</main>;
  if(!user)return <main className="min-h-screen grid place-items-center bg-slate-100 text-slate-700">Faça login em /interno para visualizar a proposta.</main>;
  if(!proposal)return <main className="min-h-screen grid place-items-center bg-slate-100 text-slate-700">{message||"Carregando proposta…"}</main>;
  return <main className="min-h-screen bg-slate-200 py-8 text-slate-900 print:bg-white print:py-0">
    <style jsx global>{`
      @page { size: A4; margin: 14mm; }
      @media print {
        body { background: white !important; }
        .proposal-sheet { box-shadow: none !important; margin: 0 !important; width: auto !important; max-width: none !important; }
        .proposal-section { break-inside: avoid; }
        .cover { break-after: page; min-height: 245mm !important; }
      }
    `}</style>
    <div className="mx-auto mb-4 flex max-w-[210mm] justify-between px-2 print:hidden"><a href={`/interno/propostas/${id}`} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow"><ArrowLeft size={15}/>Voltar ao editor</a><button onClick={()=>window.print()} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"><Printer size={15}/>Imprimir / Salvar PDF</button></div>
    <article className="proposal-sheet mx-auto w-[210mm] max-w-[calc(100%-24px)] bg-white shadow-2xl">
      <section className="cover relative flex min-h-[280mm] flex-col justify-between overflow-hidden bg-[#040c17] p-14 text-white">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl"/><div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl"/>
        <div className="relative"><img src="/algenri-logo.webp" alt="ALGENRI" className="h-16 w-auto object-contain object-left"/><p className="mt-16 text-xs font-semibold tracking-[.28em] text-cyan-300">PROPOSTA COMERCIAL</p><h1 className="mt-5 max-w-2xl text-5xl font-semibold leading-tight tracking-[-.04em]">{proposal.title}</h1><p className="mt-6 text-xl text-white/65">{proposal.clientName}</p><p className="mt-1 text-base text-white/45">{proposal.projectName}</p></div>
        <div className="relative border-t border-white/15 pt-6"><div className="grid grid-cols-2 gap-6 text-sm"><div><p className="text-white/35">Proposta</p><p className="mt-1 font-semibold">{proposal.proposalNumber} · v{proposal.version}</p></div><div><p className="text-white/35">Validade</p><p className="mt-1 font-semibold">{date(proposal.validityDate)}</p></div></div><p className="mt-8 text-sm text-white/55">Tecnologia que impulsiona o seu amanhã.</p></div>
      </section>

      <div className="p-12">
        {proposal.summary&&<section className="proposal-section mb-10 rounded-2xl bg-slate-50 p-7"><p className="text-xs font-semibold tracking-[.2em] text-cyan-700">RESUMO EXECUTIVO</p><p className="mt-4 whitespace-pre-line leading-7 text-slate-700">{proposal.summary}</p></section>}
        {proposal.sections.sort((a,b)=>a.order-b.order).map(section=>section.content?<section key={section.id} className="proposal-section mb-9"><h2 className="text-2xl font-semibold tracking-tight text-slate-950">{section.title}</h2><div className="mt-3 h-0.5 w-12 bg-cyan-500"/><p className="mt-4 whitespace-pre-line leading-7 text-slate-700">{section.content}</p></section>:null)}

        <section className="proposal-section mt-12 border-t border-slate-200 pt-9"><h2 className="text-2xl font-semibold">Investimento</h2>
          {oneTimeItems.length>0&&<div className="mt-5"><p className="text-sm font-semibold text-slate-500">Investimento inicial</p><div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">{oneTimeItems.map(i=><div key={i.id} className="flex items-center justify-between gap-4 px-4 py-3"><div><p className="font-medium">{i.description||"Item"}</p><p className="text-xs text-slate-400">Qtd. {i.quantity}</p></div><p className="font-semibold">{money(i.totalValue)}</p></div>)}</div></div>}
          {recurringItems.length>0&&<div className="mt-6"><p className="text-sm font-semibold text-slate-500">Serviços recorrentes</p><div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">{recurringItems.map(i=><div key={i.id} className="flex items-center justify-between gap-4 px-4 py-3"><div><p className="font-medium">{i.description||"Item recorrente"}</p><p className="text-xs text-slate-400">{i.recurrence==="annual"?"Cobrança anual":i.recurrence==="monthly"?"Cobrança mensal":"Recorrência personalizada"}</p></div><p className="font-semibold">{money(i.totalValue)}</p></div>)}</div></div>}
          <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-950 p-4 text-white"><p className="text-xs text-white/50">Investimento inicial</p><p className="mt-1 text-xl font-semibold">{money(proposal.total)}</p></div>{proposal.recurringMonthly>0&&<div className="rounded-xl bg-slate-100 p-4"><p className="text-xs text-slate-500">Recorrência mensal</p><p className="mt-1 text-xl font-semibold">{money(proposal.recurringMonthly)}/mês</p></div>}{proposal.recurringAnnual>0&&<div className="rounded-xl bg-slate-100 p-4"><p className="text-xs text-slate-500">Recorrência anual</p><p className="mt-1 text-xl font-semibold">{money(proposal.recurringAnnual)}/ano</p></div>}</div>
          {proposal.discountType!=="none"&&<p className="mt-3 text-xs text-slate-500">Desconto aplicado: {proposal.discountType==="percentage"?`${proposal.discountValue}%` : money(proposal.discountValue)}{proposal.discountType==="percentage"&&proposal.discountScope==="all"?" sobre valores inicial e recorrentes":" sobre investimento inicial"}.</p>}
        </section>

        {proposal.paymentTerms&&<section className="proposal-section mt-9"><h2 className="text-xl font-semibold">Condições de pagamento</h2><p className="mt-3 whitespace-pre-line leading-7 text-slate-700">{proposal.paymentTerms}</p></section>}
        {proposal.commercialConditions&&<section className="proposal-section mt-7"><h2 className="text-xl font-semibold">Condições comerciais</h2><p className="mt-3 whitespace-pre-line leading-7 text-slate-700">{proposal.commercialConditions}</p></section>}
        <footer className="mt-14 border-t border-slate-200 pt-6 text-xs text-slate-400"><div className="flex justify-between gap-6"><span>{proposal.proposalNumber} · v{proposal.version}</span><span>ALGENRI · Tecnologia que impulsiona o seu amanhã.</span></div></footer>
      </div>
    </article>
  </main>;
}
