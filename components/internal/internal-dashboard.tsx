"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, FileSignature, FileText, FolderKanban, Inbox, LayoutDashboard, MessageSquareText, Sparkles, Users } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Summary = {
  cards: { interested:number; newInterested:number; openProposals:number; pendingContracts:number; activeProjects:number };
  pipeline: { interested:number; briefing:number; dossier:number; proposal:number; contract:number; project:number };
  attention: { newLeads:number; proposalsAwaitingDecision:number; contractsPending:number; overdueProjects:number };
  agenda: Array<{ id:string; name:string; clientName:string; status:string; expectedDeliveryDate:string; overdue:boolean }>;
};

type NotificationPreferences = {
  commercialUpdatesInApp: boolean;
  operationUpdatesInApp: boolean;
};

const emptySummary: Summary = {
  cards: { interested:0, newInterested:0, openProposals:0, pendingContracts:0, activeProjects:0 },
  pipeline: { interested:0, briefing:0, dossier:0, proposal:0, contract:0, project:0 },
  attention: { newLeads:0, proposalsAwaitingDecision:0, contractsPending:0, overdueProjects:0 },
  agenda: [],
};

const defaultNotificationPreferences: NotificationPreferences = {
  commercialUpdatesInApp: true,
  operationUpdatesInApp: true,
};

async function authFetch(user: User, input: RequestInfo | URL) {
  const token = await user.getIdToken();
  return fetch(input, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
}

function formatDate(value:string){
  const [year,month,day]=value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(year,month-1,day));
}

const controlCards = [
  { key:"interested", href:"/interno/leads", icon:Users, label:"Interessados", helper:"Contatos ativos no funil comercial." },
  { key:"openProposals", href:"/interno/propostas", icon:FileText, label:"Propostas abertas", helper:"Propostas ainda sem encerramento comercial." },
  { key:"pendingContracts", href:"/interno/contratos", icon:FileSignature, label:"Contratos pendentes", helper:"Contratos em preparação ou assinatura." },
  { key:"activeProjects", href:"/interno/projetos", icon:FolderKanban, label:"Projetos ativos", helper:"Projetos em etapas operacionais abertas." },
] as const;

const pipeline = [
  { key:"interested", label:"Interessado", href:"/interno/leads", icon:Users },
  { key:"briefing", label:"Briefing", href:"/interno/briefings/instancias", icon:Inbox },
  { key:"dossier", label:"Dossiê", href:"/interno/dossies", icon:MessageSquareText },
  { key:"proposal", label:"Proposta", href:"/interno/propostas", icon:FileText },
  { key:"contract", label:"Contrato", href:"/interno/contratos", icon:FileSignature },
  { key:"project", label:"Projeto", href:"/interno/projetos", icon:FolderKanban },
] as const;

const quickActions = [
  { href:"/interno/leads", label:"Abrir interessados", icon:Users },
  { href:"/interno/clientes", label:"Abrir clientes", icon:BriefcaseBusiness },
  { href:"/interno/briefings/instancias", label:"Criar briefing", icon:Inbox },
  { href:"/interno/propostas", label:"Criar proposta", icon:FileText },
];

export default function InternalDashboard() {
  const [summary,setSummary]=useState<Summary>(emptySummary);
  const [notificationPreferences,setNotificationPreferences]=useState<NotificationPreferences>(defaultNotificationPreferences);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>onAuthStateChanged(firebaseAuth,async(user)=>{
    if(!user){setLoading(false);return;}
    try{
      const response=await authFetch(user,"/api/internal/dashboard");
      const payload=await response.json();
      if(!response.ok) throw new Error("Não foi possível carregar os indicadores.");
      setSummary(payload);

      try {
        const preferencesResponse=await authFetch(user,"/api/internal/settings/notifications");
        if(preferencesResponse.ok){
          const preferencesPayload=await preferencesResponse.json();
          setNotificationPreferences({
            commercialUpdatesInApp: preferencesPayload.preferences?.commercialUpdatesInApp ?? true,
            operationUpdatesInApp: preferencesPayload.preferences?.operationUpdatesInApp ?? true,
          });
        }
      } catch {
        setNotificationPreferences(defaultNotificationPreferences);
      }
    }catch(err){setError(err instanceof Error?err.message:"Falha ao carregar os indicadores.");}
    finally{setLoading(false);}
  }),[]);

  const attention = [
    { category:"commercial" as const, title:"Novos interessados", value:summary.attention.newLeads, text:"Aguardando primeiro atendimento comercial.", href:"/interno/leads" },
    { category:"commercial" as const, title:"Propostas sem decisão", value:summary.attention.proposalsAwaitingDecision, text:"Enviadas ou em negociação aguardando retorno.", href:"/interno/propostas" },
    { category:"commercial" as const, title:"Contratos pendentes", value:summary.attention.contractsPending, text:"Em preparação ou aguardando assinatura.", href:"/interno/contratos" },
    { category:"operation" as const, title:"Projetos em atraso", value:summary.attention.overdueProjects, text:"Com data prevista de entrega já ultrapassada.", href:"/interno/projetos" },
  ].filter((item)=>item.category==="commercial" ? notificationPreferences.commercialUpdatesInApp : notificationPreferences.operationUpdatesInApp);

  return (
    <main className="min-h-screen bg-[#040c17] px-5 pb-20 pt-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-8 xl:flex-row xl:items-end xl:justify-between">
          <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.25em] text-cyan-300"><LayoutDashboard className="h-4 w-4" /> Área interna</div><h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Dashboard ALGENRI</h1><p className="mt-3 max-w-3xl leading-7 text-white/55">Visão de comando com indicadores reais do ciclo comercial e operacional.</p></div>
          <a href="/interno/prontidao" className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.06] px-4 py-2 text-xs text-emerald-200"><BadgeCheck className="h-4 w-4" /> Operação liberada para vendas</a>
        </div>

        {error && <p className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[.05] px-4 py-3 text-sm text-amber-100">{error}</p>}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {controlCards.map(({key,href,icon:Icon,label,helper})=><a key={key} href={href} className="group rounded-[24px] border border-white/10 bg-white/[.035] p-5 transition hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-white/[.05]"><div className="flex items-start justify-between gap-4"><div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.04]"><Icon className="h-5 w-5 text-cyan-300" /></div><span className="text-3xl font-semibold tracking-[-.04em] text-white">{loading?"—":summary.cards[key]}</span></div><div className="mt-5 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-white/85">{label}</p><p className="mt-1 text-xs leading-5 text-white/40">{helper}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-white/25 transition group-hover:translate-x-1 group-hover:text-cyan-300" /></div></a>)}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_.85fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">Pipeline comercial</p><p className="mt-1 text-xs text-white/35">Quantidade real de registros em cada etapa.</p></div><Sparkles className="h-5 w-5 text-cyan-300/70" /></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{pipeline.map(({key,label,href,icon:Icon},index)=><a key={key} href={href} className="group rounded-2xl border border-white/[.08] bg-black/15 p-4 transition hover:border-cyan-300/20 hover:bg-white/[.04]"><div className="flex items-center justify-between"><Icon className="h-4 w-4 text-cyan-200" /><span className="text-2xl font-semibold text-white">{loading?"—":summary.pipeline[key]}</span></div><div className="mt-5 flex items-end justify-between"><div><p className="font-medium">{label}</p><p className="mt-1 text-xs text-white/32">Abrir etapa</p></div><span className="text-[10px] text-white/20">0{index+1}</span></div></a>)}</div></div>

          <div className="rounded-[28px] border border-amber-300/10 bg-amber-300/[.025] p-5 sm:p-6"><p className="text-sm font-semibold">Atenção necessária</p><p className="mt-1 text-xs leading-5 text-white/35">Pendências calculadas a partir dos registros atuais e das suas preferências de alerta.</p><div className="mt-5 space-y-3">{attention.length===0?<div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-5 text-sm leading-6 text-white/35">Os alertas comerciais e operacionais estão desativados nas suas preferências. Você pode reativá-los em Configurações → Notificações.</div>:attention.map(item=><a key={item.title} href={item.href} className="block rounded-2xl border border-white/[.07] bg-black/15 p-4 transition hover:border-amber-200/20 hover:bg-white/[.035]"><div className="flex items-start gap-3"><span className={`grid h-8 min-w-8 place-items-center rounded-lg text-sm font-semibold ${item.value>0?"bg-amber-300/10 text-amber-100":"bg-emerald-300/[.07] text-emerald-200"}`}>{loading?"—":item.value}</span><div className="flex-1"><p className="text-sm font-medium text-white/82">{item.title}</p><p className="mt-1 text-xs leading-5 text-white/38">{item.text}</p></div><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-white/20" /></div></a>)}</div></div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6"><p className="text-sm font-semibold">Ações rápidas</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{quickActions.map(({href,label,icon:Icon})=><a key={label} href={href} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[.08] bg-black/15 px-4 py-4 text-sm text-white/60 transition hover:border-cyan-300/20 hover:text-white"><span className="flex items-center gap-3"><Icon className="h-4 w-4 text-cyan-200" />{label}</span><ArrowRight className="h-4 w-4 text-white/20" /></a>)}</div></div>

          <div className="rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6"><p className="text-sm font-semibold">Agenda operacional</p><p className="mt-1 text-xs text-white/35">Próximas entregas registradas nos projetos.</p><div className="mt-5 space-y-3">{loading?<div className="rounded-2xl border border-white/[.08] p-4 text-sm text-white/35">Carregando prazos…</div>:summary.agenda.length===0?<div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-5 text-sm text-white/30">Nenhum projeto com data prevista de entrega registrada.</div>:summary.agenda.map(item=><a key={item.id} href={`/interno/projetos/${item.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-white/[.08] bg-black/15 p-4 transition hover:border-cyan-300/20"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-white/82">{item.name}</p>{item.overdue&&<span className="rounded-full bg-rose-300/10 px-2 py-0.5 text-[10px] text-rose-200">atrasado</span>}</div><p className="mt-1 text-xs text-white/35">{item.clientName}</p></div><div className="text-right"><p className={`text-sm font-medium ${item.overdue?"text-rose-200":"text-cyan-200"}`}>{formatDate(item.expectedDeliveryDate)}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/25">entrega</p></div></a>)}</div></div>
        </section>
      </div>
    </main>
  );
}
