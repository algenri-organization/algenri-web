"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, sendPasswordResetEmail, type User } from "firebase/auth";
import { ShieldCheck, UserPlus, Users } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type ModuleKey = "commercial"|"operation"|"finance"|"settings";
type TeamUser = { uid:string; email:string; displayName:string; role:"admin"|"member"; active:boolean; permissions:ModuleKey[] };
const modules:{key:ModuleKey;label:string}[]=[
  {key:"commercial",label:"Comercial"},
  {key:"operation",label:"Operação"},
  {key:"finance",label:"Financeiro"},
  {key:"settings",label:"Configurações"},
];

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(input, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } });
}

export default function TeamAccessAdmin() {
  const [user,setUser]=useState<User|null>(firebaseAuth.currentUser);
  const [users,setUsers]=useState<TeamUser[]>([]);
  const [email,setEmail]=useState("");
  const [displayName,setDisplayName]=useState("");
  const [role,setRole]=useState<"admin"|"member">("member");
  const [permissions,setPermissions]=useState<ModuleKey[]>(["commercial","operation"]);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [admin,setAdmin]=useState(true);

  useEffect(()=>onAuthStateChanged(firebaseAuth,setUser),[]);
  useEffect(()=>{if(user) load(user);},[user]);

  async function load(active:User){
    setLoading(true);setError("");
    try{
      const r=await authFetch(active,"/api/internal/users");
      const p=await r.json();
      if(r.status===403&&p.error==="admin_required"){setAdmin(false);setUsers([]);return;}
      if(!r.ok)throw new Error("Não foi possível carregar os usuários.");
      setAdmin(true);setUsers(p.users??[]);
    }catch(e){setError(e instanceof Error?e.message:"Não foi possível carregar os usuários.");}
    finally{setLoading(false);}
  }

  function toggleNewPermission(key:ModuleKey){
    setPermissions(current=>current.includes(key)?current.filter(v=>v!==key):[...current,key]);
  }

  async function invite(){
    if(!user)return;setMessage("");setError("");
    try{
      const r=await authFetch(user,"/api/internal/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,displayName,role,permissions:role==="admin"?modules.map(m=>m.key):permissions})});
      const p=await r.json();
      if(!r.ok){if(p.error==="domain_not_allowed")throw new Error("Use um e-mail @algenri.com.br.");throw new Error("Não foi possível provisionar o usuário.");}
      await sendPasswordResetEmail(firebaseAuth,email.trim().toLowerCase());
      setEmail("");setDisplayName("");setRole("member");setPermissions(["commercial","operation"]);
      setMessage("Usuário provisionado e e-mail de ativação enviado para definição da senha.");
      await load(user);
    }catch(e){setError(e instanceof Error?e.message:"Não foi possível adicionar o usuário.");}
  }

  async function update(target:TeamUser, patch:Partial<Pick<TeamUser,"role"|"active"|"permissions">>){
    if(!user)return;setMessage("");setError("");
    const r=await authFetch(user,"/api/internal/users",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({uid:target.uid,...patch})});
    const p=await r.json();
    if(!r.ok){setError(p.error==="cannot_disable_self"?"Você não pode desativar seu próprio acesso.":p.error==="cannot_demote_self"?"Você não pode remover seu próprio perfil de administrador.":"Não foi possível atualizar o usuário.");return;}
    setMessage("Acesso atualizado.");await load(user);
  }

  function toggleUserPermission(target:TeamUser,key:ModuleKey){
    const next=target.permissions.includes(key)?target.permissions.filter(v=>v!==key):[...target.permissions,key];
    update(target,{permissions:next});
  }

  if(!user)return null;
  if(!admin&&!loading)return <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.025] p-6"><div className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4 text-cyan-300"/>Equipe e acessos</div><p className="mt-2 text-sm text-white/45">A gestão de usuários é restrita a administradores.</p></section>;

  return <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.025] p-6">
    <div className="flex items-center gap-2"><Users className="h-5 w-5 text-cyan-300"/><div><h2 className="font-semibold">Equipe e acessos</h2><p className="mt-1 text-sm text-white/40">Cadastre contas internas e defina exatamente quais módulos cada colaborador pode acessar.</p></div></div>
    <div className="mt-5 grid gap-3 md:grid-cols-4">
      <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Nome" className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none"/>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="nome@algenri.com.br" className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none"/>
      <select value={role} onChange={e=>setRole(e.target.value as "admin"|"member")} className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none"><option value="member">Colaborador</option><option value="admin">Administrador</option></select>
      <button onClick={invite} disabled={!email.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-40"><UserPlus className="h-4 w-4"/>Adicionar usuário</button>
    </div>
    {role==="member"&&<div className="mt-3 flex flex-wrap gap-2">{modules.map(m=><button type="button" key={m.key} onClick={()=>toggleNewPermission(m.key)} className={`rounded-full border px-3 py-1.5 text-xs ${permissions.includes(m.key)?"border-cyan-300/25 bg-cyan-300/10 text-cyan-100":"border-white/10 text-white/35"}`}>{m.label}</button>)}</div>}
    <div className="mt-5 space-y-3">{loading?<p className="text-sm text-white/40">Carregando usuários…</p>:users.map(item=><div key={item.uid} className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="font-medium">{item.displayName||item.email.split("@")[0]}</p>{item.role==="admin"&&<ShieldCheck className="h-4 w-4 text-cyan-300"/>}</div><p className="mt-1 text-xs text-white/35">{item.email}</p></div><div className="flex flex-wrap items-center gap-2"><select value={item.role} onChange={e=>update(item,{role:e.target.value as "admin"|"member"})} className="rounded-lg border border-white/10 bg-[#071423] px-2.5 py-2 text-xs"><option value="member">Colaborador</option><option value="admin">Administrador</option></select><button onClick={()=>update(item,{active:!item.active})} className={`rounded-lg border px-3 py-2 text-xs ${item.active?"border-emerald-300/15 bg-emerald-300/[.05] text-emerald-200":"border-rose-300/15 bg-rose-300/[.05] text-rose-200"}`}>{item.active?"Ativo":"Inativo"}</button></div></div>{item.role==="member"&&<div className="mt-3 flex flex-wrap gap-2 border-t border-white/5 pt-3">{modules.map(m=><button key={m.key} onClick={()=>toggleUserPermission(item,m.key)} className={`rounded-full border px-3 py-1.5 text-[11px] ${item.permissions.includes(m.key)?"border-cyan-300/20 bg-cyan-300/[.07] text-cyan-100":"border-white/10 text-white/30"}`}>{m.label}</button>)}</div>}</div>)}</div>
    <p className="mt-4 text-xs text-white/30">Administradores possuem acesso total. Para colaboradores, os módulos não selecionados ficam ocultos e bloqueados também nas APIs internas correspondentes.</p>
    {(message||error)&&<p className={`mt-4 rounded-xl border px-4 py-3 text-sm ${error?"border-rose-400/20 bg-rose-400/5 text-rose-100":"border-emerald-400/20 bg-emerald-400/5 text-emerald-100"}`}>{error||message}</p>}
  </section>;
}
