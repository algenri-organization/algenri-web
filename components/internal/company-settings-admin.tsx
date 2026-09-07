"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Building2, Save, ShieldCheck } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type CompanySettings = {
  brandName: string;
  legalName: string;
  cnpj: string;
  address: string;
  cityState: string;
  representative: string;
  email: string;
  phone: string;
  website: string;
  slogan: string;
};

const empty: CompanySettings = { brandName:"", legalName:"", cnpj:"", address:"", cityState:"", representative:"", email:"", phone:"", website:"", slogan:"" };

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(input, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } });
}

export default function CompanySettingsAdmin() {
  const [user,setUser]=useState<User|null>(firebaseAuth.currentUser);
  const [form,setForm]=useState<CompanySettings>(empty);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [admin,setAdmin]=useState(true);

  useEffect(()=>onAuthStateChanged(firebaseAuth,setUser),[]);
  useEffect(()=>{ if(user) load(user); },[user]);

  async function load(active: User) {
    setLoading(true); setError("");
    try {
      const r=await authFetch(active,"/api/internal/settings/company");
      const p=await r.json();
      if(!r.ok) throw new Error(p.error==="module_access_denied"?"Você não possui acesso ao módulo Configurações.":"Não foi possível carregar os dados da empresa.");
      setForm(p.settings??empty);
    } catch(e) { setError(e instanceof Error?e.message:"Não foi possível carregar os dados da empresa."); }
    finally { setLoading(false); }
  }

  async function save() {
    if(!user) return;
    setSaving(true); setMessage(""); setError("");
    try {
      const r=await authFetch(user,"/api/internal/settings/company",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const p=await r.json();
      if(r.status===403&&p.error==="admin_required"){setAdmin(false);throw new Error("Somente administradores podem alterar os dados institucionais.");}
      if(!r.ok) throw new Error("Não foi possível salvar os dados da empresa.");
      setForm(p.settings??form); setMessage("Dados institucionais atualizados com sucesso."); setAdmin(true);
    } catch(e) { setError(e instanceof Error?e.message:"Não foi possível salvar os dados da empresa."); }
    finally { setSaving(false); }
  }

  const input="w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/40";
  const fields:[keyof CompanySettings,string,string][]=[
    ["brandName","Nome da marca","ALGENRI"],
    ["legalName","Razão social","Empresa faturadora"],
    ["cnpj","CNPJ","Preencher após validação contábil"],
    ["representative","Representante legal","Nome completo"],
    ["address","Endereço","Rua, número, complemento"],
    ["cityState","Cidade / UF","Ponta Grossa/PR"],
    ["email","E-mail institucional","contato@algenri.com.br"],
    ["phone","Telefone / WhatsApp","(00) 00000-0000"],
    ["website","Site","algenri.com.br"],
    ["slogan","Slogan","Tecnologia que impulsiona o seu amanhã."],
  ];

  if(!user)return null;
  return <main className="min-h-screen bg-[#040c17] px-5 pb-20 pt-28 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl">
    <div className="border-b border-white/10 pb-8"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.25em] text-cyan-300"><Building2 className="h-4 w-4"/> Empresa e identidade</div><h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Dados institucionais</h1><p className="mt-3 max-w-3xl leading-7 text-white/55">Centralize as informações que futuramente poderão alimentar propostas, contratos, documentos e integrações da ALGENRI.</p></div>
    <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6">
      <div className="flex items-start gap-3 rounded-2xl border border-cyan-300/12 bg-cyan-300/[.03] p-4"><ShieldCheck className="mt-0.5 h-5 w-5 text-cyan-300"/><p className="text-sm leading-6 text-white/48">Campos jurídicos ainda não confirmados permanecem em branco. Não serão inferidos automaticamente. O preenchimento deve refletir os dados oficiais da empresa.</p></div>
      {loading?<p className="mt-6 text-sm text-white/40">Carregando dados…</p>:<div className="mt-6 grid gap-4 md:grid-cols-2">{fields.map(([key,label,placeholder])=><label key={key} className={key==="address"||key==="slogan"?"md:col-span-2":""}><span className="mb-2 block text-xs font-medium text-white/50">{label}</span><input className={input} value={form[key]} placeholder={placeholder} onChange={e=>setForm(current=>({...current,[key]:e.target.value}))}/></label>)}</div>}
      <div className="mt-6 flex flex-wrap items-center gap-3"><button disabled={saving||loading||!admin} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-40"><Save className="h-4 w-4"/>{saving?"Salvando…":"Salvar dados"}</button><a href="/interno/configuracoes" className="text-sm text-white/45 hover:text-white">Voltar para Configurações</a></div>
      {(message||error)&&<p className={`mt-5 rounded-xl border px-4 py-3 text-sm ${error?"border-rose-400/20 bg-rose-400/5 text-rose-100":"border-emerald-400/20 bg-emerald-400/5 text-emerald-100"}`}>{error||message}</p>}
    </section>
  </div></main>;
}
