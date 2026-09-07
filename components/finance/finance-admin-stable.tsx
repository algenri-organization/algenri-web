"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Banknote, CalendarRange, CheckCircle2, CircleDollarSign, Pencil, Plus, ReceiptText, Search, TriangleAlert } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Client = { id:string; tradeName:string; legalName:string };
type Project = { id:string; clientId:string; name:string };
type Charge = { id:string; clientId:string; clientName:string; projectId:string; projectName:string; description:string; amountCents:number; dueDate:string; status:"pending"|"paid"|"cancelled"; paidAt:string|null; paymentMethod:string; notes:string; scheduleType?:"single"|"installments"|"recurring"; installmentIndex?:number; installmentCount?:number; recurrenceFrequency?:string; bankProvider?:"manual"|"c6"|"cora" };
type Provider = { provider:"c6"|"cora"; label:string; configured:boolean; mode:string; missing:string[] };

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(input, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } });
}

const money=(c:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(c/100);
const blank={clientId:"",projectId:"",description:"",amount:"",dueDate:"",paymentMethod:"Pix",notes:"",scheduleType:"single",installmentCount:"2",recurrenceFrequency:"monthly",recurrenceCount:"12",bankProvider:"manual"};
const recurrenceLabels:Record<string,string>={monthly:"Mensal",quarterly:"Trimestral",semiannual:"Semestral",annual:"Anual"};

export default function FinanceAdminStable(){
  const [user,setUser]=useState<User|null>(null);
  const [ready,setReady]=useState(false);
  const [clients,setClients]=useState<Client[]>([]);
  const [projects,setProjects]=useState<Project[]>([]);
  const [charges,setCharges]=useState<Charge[]>([]);
  const [providers,setProviders]=useState<Provider[]>([]);
  const [form,setForm]=useState<any>(blank);
  const [creating,setCreating]=useState(false);
  const [editing,setEditing]=useState<Charge|null>(null);
  const [message,setMessage]=useState("");
  const [statusFilter,setStatusFilter]=useState("all");
  const [clientFilter,setClientFilter]=useState("");
  const [query,setQuery]=useState("");

  useEffect(()=>onAuthStateChanged(firebaseAuth,u=>{setUser(u);setReady(true)}),[]);
  useEffect(()=>{ if(user) load(user).catch(e=>setMessage(e instanceof Error?e.message:"Não foi possível carregar o financeiro.")); },[user]);

  async function load(active=user){
    if(!active)return;
    const [cr,clr,pr,br]=await Promise.all([
      authFetch(active,"/api/internal/finance/charges"),
      authFetch(active,"/api/internal/clients"),
      authFetch(active,"/api/internal/projects"),
      authFetch(active,"/api/internal/finance/banking/status")
    ]);
    const [cp,clp,pp,bp]=await Promise.all([cr.json(),clr.json(),pr.json(),br.json()]);
    if(!cr.ok||!clr.ok||!pr.ok||!br.ok) throw new Error("Não foi possível carregar o financeiro.");
    setCharges(cp.charges??[]); setClients(clp.clients??[]); setProjects(pp.projects??[]); setProviders(bp.providers??[]);
  }

  async function create(){
    if(!user)return; setMessage("");
    const r=await authFetch(user,"/api/internal/finance/charges",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    const p=await r.json();
    if(!r.ok){setMessage(p.error==="amount_required"?"Informe um valor válido.":p.error==="due_date_required"?"Informe o vencimento.":p.error==="description_required"?"Informe a descrição da cobrança.":"Não foi possível registrar a cobrança.");return;}
    setForm(blank); setCreating(false); await load(user); const count=p.charges?.length??1; setMessage(count>1?`${count} cobranças geradas com sucesso.`:"Cobrança registrada com sucesso.");
  }

  async function mark(id:string,status:"paid"|"pending"|"cancelled",paymentMethod?:string){
    if(!user)return;
    const r=await authFetch(user,`/api/internal/finance/charges/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status,paymentMethod})});
    if(!r.ok){setMessage("Não foi possível atualizar a cobrança.");return;}
    await load(user); setMessage(status==="paid"?"Recebimento confirmado.":"Cobrança atualizada.");
  }

  function startEdit(c:Charge){
    setEditing(c); setCreating(false);
    setForm({...blank,clientId:c.clientId,projectId:c.projectId,description:c.description,amount:(c.amountCents/100).toFixed(2).replace(".",","),dueDate:c.dueDate,paymentMethod:c.paymentMethod||"Pix",notes:c.notes||"",bankProvider:c.bankProvider||"manual"});
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function saveEdit(){
    if(!user||!editing)return;
    const r=await authFetch(user,`/api/internal/finance/charges/${editing.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:form.description,amount:form.amount,dueDate:form.dueDate,paymentMethod:form.paymentMethod,notes:form.notes})});
    const p=await r.json();
    if(!r.ok){setMessage(p.error==="amount_required"?"Informe um valor válido.":p.error==="due_date_required"?"Informe o vencimento.":p.error==="description_required"?"Informe a descrição da cobrança.":"Não foi possível salvar as alterações.");return;}
    setEditing(null); setForm(blank); await load(user); setMessage("Cobrança atualizada com sucesso.");
  }

  const today=new Date().toISOString().slice(0,10);
  const pending=charges.filter(c=>c.status==="pending");
  const paid=charges.filter(c=>c.status==="paid");
  const overdue=pending.filter(c=>c.dueDate<today);
  const totalPending=pending.reduce((s,c)=>s+c.amountCents,0);
  const totalPaid=paid.reduce((s,c)=>s+c.amountCents,0);
  const totalOverdue=overdue.reduce((s,c)=>s+c.amountCents,0);
  const filteredProjects=projects.filter(p=>!form.clientId||p.clientId===form.clientId);
  const horizon=(days:number)=>{const d=new Date();d.setDate(d.getDate()+days);const limit=d.toISOString().slice(0,10);return pending.filter(c=>c.dueDate>=today&&c.dueDate<=limit).reduce((s,c)=>s+c.amountCents,0)};
  const forecast=[{label:"Próximos 30 dias",value:horizon(30)},{label:"Próximos 60 dias",value:horizon(60)},{label:"Próximos 90 dias",value:horizon(90)}];
  const visible=charges.filter(c=>{const overdueNow=c.status==="pending"&&c.dueDate<today;const statusOk=statusFilter==="all"||(statusFilter==="overdue"?overdueNow:c.status===statusFilter);const clientOk=!clientFilter||c.clientId===clientFilter;const q=query.trim().toLowerCase();return statusOk&&clientOk&&(!q||`${c.clientName} ${c.description} ${c.projectName}`.toLowerCase().includes(q));});
  const cards=[{label:"A receber",value:money(totalPending),icon:CircleDollarSign},{label:"Recebido",value:money(totalPaid),icon:CheckCircle2},{label:"Em aberto",value:String(pending.length),icon:ReceiptText},{label:"Vencidas",value:String(overdue.length),icon:TriangleAlert}];
  const input="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/40";

  if(!ready)return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Carregando…</main>;
  if(!user)return null;

  return <main className="min-h-screen bg-[#040c17] text-white">
    <header className="border-b border-white/10 bg-[#06111f]/90 px-6 py-5"><div className="mx-auto max-w-7xl"><p className="text-xs font-semibold tracking-[.25em] text-cyan-300">ALGENRI FINANCEIRO</p><div className="mt-1 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Controle financeiro</h1><p className="mt-1 text-sm text-white/45">Cobranças, parcelamentos, recorrência, previsão e integração bancária.</p></div><button onClick={()=>{setCreating(v=>!v);setEditing(null);setForm(blank)}} className="flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950"><Plus size={16}/>Nova cobrança</button></div></div></header>
    <div className="mx-auto max-w-7xl px-6 py-8">
      {overdue.length>0&&<section className="mb-6 flex flex-col gap-3 rounded-2xl border border-rose-300/25 bg-rose-300/[.06] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-200"/><div><p className="font-semibold text-rose-100">Atenção: {overdue.length} cobrança{overdue.length>1?"s":""} em atraso</p><p className="mt-1 text-sm text-rose-100/60">Total inadimplente: {money(totalOverdue)}.</p></div></div><button onClick={()=>setStatusFilter("overdue")} className="rounded-xl border border-rose-200/20 px-3 py-2 text-xs text-rose-100">Ver inadimplentes</button></section>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({label,value,icon:Icon})=><div key={label} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-center justify-between"><p className="text-sm text-white/50">{label}</p><Icon className="h-4 w-4 text-cyan-300"/></div><p className="mt-3 text-2xl font-semibold">{value}</p></div>)}</div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]"><section className="rounded-3xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-center gap-2"><CalendarRange className="h-5 w-5 text-violet-200"/><h2 className="font-semibold">Previsão de recebimentos</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{forecast.map(f=><div key={f.label} className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs text-white/40">{f.label}</p><p className="mt-2 text-lg font-semibold text-violet-100">{money(f.value)}</p></div>)}</div></section><section className="rounded-3xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-center gap-2"><Banknote className="h-5 w-5 text-cyan-200"/><h2 className="font-semibold">Integração bancária</h2></div><div className="mt-4 space-y-2">{providers.map(p=><div key={p.provider} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/10 px-3 py-3"><div><p className="text-sm">{p.label}</p><p className="text-[11px] text-white/35">{p.configured?"Credenciais detectadas":"Aguardando credenciais"}</p></div><span className={`rounded-full px-2 py-1 text-[10px] ${p.configured?"bg-emerald-300/10 text-emerald-100":"bg-amber-300/10 text-amber-100"}`}>{p.configured?"Preparado":"Manual"}</span></div>)}</div></section></div>
      {(creating||editing)&&<section className="mt-6 rounded-3xl border border-cyan-300/15 bg-cyan-300/[.025] p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{editing?"Editar cobrança":"Nova cobrança"}</h2>{editing&&<span className="text-xs text-white/35">Cliente: {editing.clientName}</span>}</div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{!editing&&<><select className={input} value={form.clientId} onChange={e=>setForm((f:any)=>({...f,clientId:e.target.value,projectId:""}))}><option value="">Selecione o cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.tradeName||c.legalName}</option>)}</select><select className={input} value={form.projectId} onChange={e=>setForm((f:any)=>({...f,projectId:e.target.value}))}><option value="">Projeto (opcional)</option>{filteredProjects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><select className={input} value={form.scheduleType} onChange={e=>setForm((f:any)=>({...f,scheduleType:e.target.value}))}><option value="single">Cobrança única</option><option value="installments">Parcelamento</option><option value="recurring">Recorrência</option></select>{form.scheduleType==="installments"&&<input className={input} type="number" min="2" max="60" placeholder="Nº de parcelas" value={form.installmentCount} onChange={e=>setForm((f:any)=>({...f,installmentCount:e.target.value}))}/>} {form.scheduleType==="recurring"&&<><select className={input} value={form.recurrenceFrequency} onChange={e=>setForm((f:any)=>({...f,recurrenceFrequency:e.target.value}))}>{Object.entries(recurrenceLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><input className={input} type="number" min="2" max="60" placeholder="Nº de ocorrências" value={form.recurrenceCount} onChange={e=>setForm((f:any)=>({...f,recurrenceCount:e.target.value}))}/></>}<select className={input} value={form.bankProvider} onChange={e=>setForm((f:any)=>({...f,bankProvider:e.target.value}))}><option value="manual">Controle manual</option><option value="c6">C6 Bank</option><option value="cora">Cora</option></select></>}<input className={input} placeholder={form.scheduleType==="installments"?"Valor total do parcelamento":"Valor da cobrança"} value={form.amount} onChange={e=>setForm((f:any)=>({...f,amount:e.target.value}))}/><input className={input} type="date" value={form.dueDate} onChange={e=>setForm((f:any)=>({...f,dueDate:e.target.value}))}/><input className={input} placeholder="Descrição da cobrança" value={form.description} onChange={e=>setForm((f:any)=>({...f,description:e.target.value}))}/><select className={input} value={form.paymentMethod} onChange={e=>setForm((f:any)=>({...f,paymentMethod:e.target.value}))}><option>Pix</option><option>Transferência</option><option>Boleto</option><option>Cartão</option><option>Outro</option></select><input className={`${input} xl:col-span-2`} placeholder="Observações" value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))}/></div><div className="mt-4 flex justify-end gap-2"><button onClick={()=>{setCreating(false);setEditing(null);setForm(blank)}} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/50">Fechar</button><button onClick={editing?saveEdit:create} className="rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950">{editing?"Salvar alterações":"Registrar cobrança"}</button></div></section>}
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.02] p-4"><div className="grid gap-3 md:grid-cols-3"><label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-white/25"/><input className={`${input} w-full pl-9`} placeholder="Buscar cliente, descrição ou projeto" value={query} onChange={e=>setQuery(e.target.value)}/></label><select className={input} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">Todos os status</option><option value="pending">Em aberto</option><option value="overdue">Em atraso</option><option value="paid">Recebidos</option><option value="cancelled">Cancelados</option></select><select className={input} value={clientFilter} onChange={e=>setClientFilter(e.target.value)}><option value="">Todos os clientes</option>{clients.map(c=><option key={c.id} value={c.id}>{c.tradeName||c.legalName}</option>)}</select></div></section>
      <div className="mt-6 grid gap-6 xl:grid-cols-2"><section id="cobrancas" className="rounded-3xl border border-white/10 bg-white/[.025] p-5"><h2 className="text-lg font-semibold">Cobranças</h2><div className="mt-4 space-y-3">{visible.filter(c=>c.status==="pending").map(c=><div key={c.id} className={`rounded-2xl border p-4 ${c.dueDate<today?"border-rose-300/20 bg-rose-300/[.035]":"border-white/10 bg-black/10"}`}><div className="flex items-start justify-between gap-4"><div><p className="font-medium">{c.clientName}</p><p className="mt-1 text-sm text-white/55">{c.description}</p><p className="mt-2 text-xs text-white/35">{c.projectName||"Sem projeto vinculado"} · venc. {c.dueDate.split("-").reverse().join("/")}{c.installmentCount&&c.installmentCount>1?` · parcela ${c.installmentIndex}/${c.installmentCount}`:""}</p></div><p className="font-semibold text-cyan-100">{money(c.amountCents)}</p></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={()=>mark(c.id,"paid",c.paymentMethod||"Pix")} className="rounded-lg border border-emerald-300/20 px-3 py-1.5 text-xs text-emerald-100">Marcar como recebido</button><button onClick={()=>startEdit(c)} className="flex items-center gap-1 rounded-lg border border-cyan-300/15 px-3 py-1.5 text-xs text-cyan-100"><Pencil className="h-3 w-3"/>Editar</button><button onClick={()=>mark(c.id,"cancelled")} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/40">Cancelar</button></div></div>)}{!visible.some(c=>c.status==="pending")&&<p className="text-sm text-white/35">Nenhuma cobrança encontrada.</p>}</div></section>
      <section id="recebimentos" className="rounded-3xl border border-white/10 bg-white/[.025] p-5"><h2 className="text-lg font-semibold">Recebimentos e histórico</h2><div className="mt-4 space-y-3">{visible.filter(c=>c.status!=="pending").map(c=><div key={c.id} className="rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-medium">{c.clientName}</p><p className="mt-1 text-sm text-white/55">{c.description}</p><p className="mt-2 text-xs text-white/35">{c.status==="paid"?"Recebido":"Cancelado"}{c.paidAt?` · ${new Date(c.paidAt).toLocaleDateString("pt-BR")}`:""}</p></div><p className={c.status==="paid"?"font-semibold text-emerald-100":"font-semibold text-white/35"}>{money(c.amountCents)}</p></div></div>)}{!visible.some(c=>c.status!=="pending")&&<p className="text-sm text-white/35">Nenhum registro encontrado.</p>}</div></section></div>
      {message&&<p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-100">{message}</p>}
    </div>
  </main>;
}
