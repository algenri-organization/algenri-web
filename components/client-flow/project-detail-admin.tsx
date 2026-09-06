"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowLeft, Save } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Project = { id:string; clientId:string; clientName:string; name:string; projectType:string; status:string; responsibleName:string; startDate:string; expectedDeliveryDate:string; description:string; notes:string };
type Client = { id:string; tradeName:string; legalName:string };
const projectLabels: Record<string,string> = { diagnosis:"Diagnóstico", briefing:"Briefing", proposal:"Proposta", contract:"Contrato", onboarding:"Onboarding", development:"Em desenvolvimento", validation:"Homologação", publication:"Publicação", delivery:"Entrega", support:"Suporte", completed:"Concluído", paused:"Pausado", cancelled:"Cancelado" };

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(input, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } });
}

export default function ProjectDetailAdmin({ id }: { id: string }) {
  const [user,setUser]=useState<User|null>(null); const [ready,setReady]=useState(false); const [project,setProject]=useState<Project|null>(null); const [client,setClient]=useState<Client|null>(null); const [message,setMessage]=useState("");
  useEffect(()=>onAuthStateChanged(firebaseAuth,u=>{setUser(u);setReady(true)}),[]);
  async function load(activeUser=user){ if(!activeUser)return; const r=await authFetch(activeUser,`/api/internal/projects/${id}`); const p=await r.json(); if(!r.ok) throw new Error("Não foi possível abrir o projeto."); setProject(p.project); setClient(p.client); }
  useEffect(()=>{ if(user) load(user).catch(e=>setMessage(e.message)); },[user,id]);
  async function save(){ if(!user||!project)return; const r=await authFetch(user,`/api/internal/projects/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(project)}); const p=await r.json(); if(!r.ok){setMessage("Não foi possível salvar o projeto.");return;} setProject(p.project); setMessage("Projeto atualizado."); }
  if(!ready) return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Carregando…</main>;
  if(!user) return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Faça login em /interno.</main>;
  if(!project) return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">{message||"Carregando projeto…"}</main>;
  const input="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/40";
  return <main className="min-h-screen bg-[#040c17] px-6 py-10 text-white"><div className="mx-auto max-w-5xl"><a href="/interno/clientes" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"><ArrowLeft size={16}/>Clientes</a><div className="mt-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 md:flex-row md:items-start"><div><p className="text-xs font-semibold tracking-[.22em] text-cyan-300">PROJETO</p><h1 className="mt-2 text-3xl font-semibold">{project.name}</h1><p className="mt-2 text-sm text-slate-400">{client?.tradeName||client?.legalName||project.clientName}</p></div><button onClick={save} className="flex items-center gap-2 self-start rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950"><Save size={16}/>Salvar</button></div>
  <div className="mt-6 grid gap-4 md:grid-cols-2"><input className={input} value={project.name} onChange={e=>setProject({...project,name:e.target.value})} placeholder="Nome do projeto"/><input className={input} value={project.projectType} onChange={e=>setProject({...project,projectType:e.target.value})} placeholder="Tipo do projeto"/><select className={input} value={project.status} onChange={e=>setProject({...project,status:e.target.value})}>{Object.entries(projectLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><input className={input} value={project.responsibleName} onChange={e=>setProject({...project,responsibleName:e.target.value})} placeholder="Responsável ALGENRI"/><input className={input} type="date" value={project.startDate||""} onChange={e=>setProject({...project,startDate:e.target.value})}/><input className={input} type="date" value={project.expectedDeliveryDate||""} onChange={e=>setProject({...project,expectedDeliveryDate:e.target.value})}/><textarea className={`${input} min-h-28 md:col-span-2`} value={project.description||""} onChange={e=>setProject({...project,description:e.target.value})} placeholder="Descrição"/><textarea className={`${input} min-h-24 md:col-span-2`} value={project.notes||""} onChange={e=>setProject({...project,notes:e.target.value})} placeholder="Observações"/></div>
  <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="text-xs tracking-[.2em] text-violet-200">CICLO DO PROJETO</p><div className="mt-4 flex flex-wrap gap-2">{Object.entries(projectLabels).filter(([k])=>!["paused","cancelled"].includes(k)).map(([k,v])=><span key={k} className={`rounded-full border px-3 py-1.5 text-xs ${project.status===k?"border-cyan-300/40 bg-cyan-300/10 text-cyan-100":"border-white/10 text-white/35"}`}>{v}</span>)}</div></section>
  {message&&<p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-100">{message}</p>}</div></main>;
}
