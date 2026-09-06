"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowLeft, Plus, Save, Sparkles } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Section = { id:string; key:string; title:string; content:string; order:number; source:string; editable:boolean };
type Item = { id:string; description:string; quantity:number; unitValue:number; totalValue:number; billingType:"one_time"|"recurring"; recurrence:"monthly"|"annual"|"custom"|null; order:number };
type Proposal = {
  id:string; proposalNumber:string; version:string; clientName:string; projectName:string; status:string; title:string; summary:string;
  sections:Section[]; investmentItems:Item[]; subtotal:number; discountType:"none"|"fixed"|"percentage"; discountScope?:"one_time"|"all"; discountValue:number;
  total:number; recurringMonthly:number; recurringAnnual:number; paymentTerms:string; validityDate:string; commercialConditions:string; observations:string;
  aiMetadata?:{ generatedAt:string; model:string; source:string }|null;
};

const labels:Record<string,string> = {
  draft:"Rascunho", in_review:"Em revisão", ready_to_send:"Pronta para envio", sent:"Enviada", negotiation:"Em negociação",
  approved:"Aprovada", rejected:"Rejeitada", expired:"Expirada", archived:"Arquivada",
};

const aiErrors:Record<string,string> = {
  ai_not_configured: "A IA não está configurada no ambiente da ALGENRI. Verifique OPENAI_API_KEY na Vercel.",
  ai_invalid_credentials: "A chave da API foi recusada. Verifique se a credencial está ativa e se a Vercel recebeu a variável correta.",
  ai_insufficient_quota: "A API está sem créditos ou cota disponível. Adicione saldo ou habilite faturamento no projeto da OpenAI e tente novamente.",
  ai_rate_limited: "O limite temporário de uso da API foi atingido. Aguarde alguns instantes e tente novamente.",
  ai_model_unavailable: "O modelo configurado não está disponível para esta conta/projeto. Revise OPENAI_PROPOSAL_MODEL.",
  ai_provider_unavailable: "O serviço de IA está temporariamente indisponível. Tente novamente em alguns minutos.",
  ai_provider_unreachable: "O servidor da ALGENRI não conseguiu se comunicar com o provedor de IA. Tente novamente em alguns minutos.",
  ai_schema_rejected: "A API recusou o formato estruturado solicitado. A integração precisa de ajuste técnico.",
  ai_empty_response: "A IA respondeu sem conteúdo utilizável. Tente gerar novamente.",
  ai_invalid_response: "A resposta da IA veio em formato inválido. Tente novamente; se persistir, será necessário ajuste técnico.",
  ai_generation_failed: "A geração falhou no provedor de IA. Tente novamente e, se persistir, consulte os logs.",
  briefing_not_available: "Este projeto não possui briefing disponível.",
  dossier_not_available: "Esta proposta não possui dossiê vinculado.",
  proposal_locked: "Esta versão está protegida. Crie uma nova versão antes de gerar com IA.",
};

async function authFetch(user:User, url:string, init?:RequestInit) {
  const token = await user.getIdToken();
  return fetch(url, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } });
}

const money = (value:number) => new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(value || 0);

export default function ProposalDetailAdmin({ id }:{ id:string }) {
  const [user, setUser] = useState<User|null>(null);
  const [ready, setReady] = useState(false);
  const [proposal, setProposal] = useState<Proposal|null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiSource, setAiSource] = useState("auto");
  const [aiInstructions, setAiInstructions] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, current => { setUser(current); setReady(true); }), []);

  async function load(activeUser = user) {
    if (!activeUser) return;
    const response = await authFetch(activeUser, `/api/internal/proposals/${id}`);
    const payload = await response.json();
    if (!response.ok) throw new Error("Não foi possível abrir a proposta.");
    setProposal({ ...payload.proposal, discountScope: payload.proposal.discountScope ?? "all" });
  }

  useEffect(() => { if (user) load(user).catch(error => setMessage(error.message)); }, [user, id]);

  async function save() {
    if (!user || !proposal || busy) return;
    setBusy(true); setMessage("");
    const response = await authFetch(user, `/api/internal/proposals/${id}`, {
      method:"PATCH", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(proposal),
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(payload.error === "proposal_locked" ? "Esta versão está protegida. Crie uma nova versão para alterar o conteúdo." : "Não foi possível salvar.");
      return;
    }
    setProposal({ ...payload.proposal, discountScope: payload.proposal.discountScope ?? "all" });
    setMessage("Proposta salva.");
  }

  async function generateAi() {
    if (!user || !proposal || aiBusy) return;
    if (!confirm("Gerar a proposta com IA? O resumo e as seções atuais serão substituídos. Valores e condições de pagamento não serão alterados.")) return;
    setAiBusy(true); setMessage("");
    const response = await authFetch(user, `/api/internal/proposals/${id}/generate-ai`, {
      method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ source:aiSource, instructions:aiInstructions }),
    });
    const payload = await response.json();
    setAiBusy(false);
    if (!response.ok) {
      setMessage(aiErrors[payload.error] || `Não foi possível gerar a proposta com IA. Código: ${payload.error || "desconhecido"}.`);
      return;
    }
    setProposal({ ...payload.proposal, discountScope: payload.proposal.discountScope ?? "all" });
    const sourceLabel = payload.source === "dossier" ? "o dossiê" : payload.source === "briefing" ? "o briefing" : "os dados do projeto";
    setMessage(`Proposta preenchida pela IA usando ${sourceLabel}. Revise antes de enviar.`);
  }

  async function setStatus(status:string) {
    if (!user || !proposal) return;
    const response = await authFetch(user, `/api/internal/proposals/${id}/status`, {
      method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ status }),
    });
    const payload = await response.json();
    if (!response.ok) { setMessage("Não foi possível alterar o status."); return; }
    setProposal({ ...payload.proposal, discountScope: payload.proposal.discountScope ?? "all" });
    setMessage(`Status alterado para ${labels[status] || status}.`);
  }

  async function newVersion() {
    if (!user || !proposal) return;
    if (!confirm("Criar uma nova versão desta proposta preservando a versão atual?")) return;
    const response = await authFetch(user, `/api/internal/proposals/${id}/new-version`, { method:"POST" });
    const payload = await response.json();
    if (!response.ok) { setMessage("Não foi possível criar a nova versão."); return; }
    window.location.href = `/interno/propostas/${payload.proposal.id}`;
  }

  function addItem() {
    if (!proposal) return;
    setProposal({ ...proposal, investmentItems:[...proposal.investmentItems, {
      id:`item-${Date.now()}`, description:"", quantity:1, unitValue:0, totalValue:0, billingType:"one_time", recurrence:null, order:proposal.investmentItems.length,
    }] });
  }

  const locked = proposal ? !["draft", "in_review"].includes(proposal.status) : false;
  const input = "rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/40 disabled:opacity-50";

  if (!ready) return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Carregando…</main>;
  if (!user) return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Faça login em /interno.</main>;
  if (!proposal) return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">{message || "Carregando proposta…"}</main>;

  return <main className="min-h-screen bg-[#040c17] px-6 py-10 text-white"><div className="mx-auto max-w-5xl">
    <a href="/interno/propostas" className="inline-flex items-center gap-2 text-sm text-white/50"><ArrowLeft size={15}/>Propostas</a>

    <div className="mt-6 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-start md:justify-between">
      <div><p className="text-xs font-semibold tracking-[.2em] text-cyan-300">{proposal.proposalNumber} · v{proposal.version}</p><h1 className="mt-2 text-3xl font-semibold">{proposal.title}</h1><p className="mt-2 text-sm text-white/45">{proposal.clientName} — {proposal.projectName}</p></div>
      <div className="flex flex-wrap gap-2">{locked ? <button onClick={newVersion} className="rounded-xl bg-violet-300 px-4 py-2.5 text-sm font-semibold text-slate-950">Criar nova versão</button> : <button disabled={busy} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950"><Save size={15}/>{busy ? "Salvando…" : "Salvar"}</button>}</div>
    </div>

    <section className="mt-6 rounded-2xl border border-violet-300/20 bg-violet-300/[.04] p-5">
      <div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-5 w-5 text-violet-200"/><div className="flex-1">
        <p className="font-semibold">Gerar proposta com IA</p>
        <p className="mt-1 text-sm leading-6 text-white/50">A IA usa o contexto existente para preencher resumo e seções. Valores, desconto e forma de pagamento continuam sob seu controle.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr]">
          <select disabled={locked || aiBusy} className={input} value={aiSource} onChange={event => setAiSource(event.target.value)}><option value="auto">Melhor fonte disponível</option><option value="dossier">Dossiê</option><option value="briefing">Briefing</option><option value="project">Somente projeto</option></select>
          <textarea disabled={locked || aiBusy} className={`${input} min-h-24`} value={aiInstructions} onChange={event => setAiInstructions(event.target.value)} placeholder="Instruções adicionais. Ex.: destaque implantação por fases e use linguagem mais executiva."/>
        </div>
        <button disabled={locked || aiBusy} onClick={generateAi} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-40"><Sparkles size={15}/>{aiBusy ? "Gerando proposta…" : "Gerar proposta completa"}</button>
        {proposal.aiMetadata && <p className="mt-2 text-xs text-white/35">Última geração por IA: fonte {proposal.aiMetadata.source} · modelo {proposal.aiMetadata.model}.</p>}
      </div></div>
    </section>

    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.025] p-5">
      <div className="flex flex-wrap gap-2">{Object.entries(labels).map(([key, value]) => <button key={key} onClick={() => setStatus(key)} className={`rounded-full border px-3 py-1.5 text-xs ${proposal.status === key ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/10 text-white/45"}`}>{value}</button>)}</div>
      {locked && <p className="mt-3 text-sm text-amber-100/75">Esta versão está protegida contra alterações comerciais.</p>}
    </section>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <input disabled={locked} className={input} value={proposal.title} onChange={event => setProposal({ ...proposal, title:event.target.value })}/>
      <input disabled={locked} type="date" className={input} value={proposal.validityDate || ""} onChange={event => setProposal({ ...proposal, validityDate:event.target.value })}/>
      <textarea disabled={locked} className={`${input} min-h-24 md:col-span-2`} value={proposal.summary || ""} onChange={event => setProposal({ ...proposal, summary:event.target.value })} placeholder="Resumo executivo da proposta"/>
    </div>

    <div className="mt-8 space-y-4">{proposal.sections.map((section, index) => <section key={section.id} className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
      <div className="flex items-center gap-2"><input disabled={locked} className={`${input} w-full font-semibold`} value={section.title} onChange={event => { const sections=[...proposal.sections]; sections[index]={...section,title:event.target.value,source:"manual"}; setProposal({...proposal,sections}); }}/>{section.source === "ai" && <span className="rounded-full border border-violet-300/20 px-2 py-1 text-[10px] text-violet-100">IA</span>}</div>
      <textarea disabled={locked} className={`${input} mt-3 min-h-36 w-full`} value={section.content || ""} onChange={event => { const sections=[...proposal.sections]; sections[index]={...section,content:event.target.value,source:"manual"}; setProposal({...proposal,sections}); }} placeholder="Conteúdo da seção"/>
    </section>)}</div>

    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.025] p-5">
      <div className="flex items-center justify-between"><div><p className="text-xs tracking-[.2em] text-cyan-200">INVESTIMENTO</p><p className="mt-1 text-sm text-white/45">Valores únicos e recorrentes são apresentados separadamente.</p></div>{!locked && <button onClick={addItem} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 px-3 py-2 text-xs text-cyan-100"><Plus size={14}/>Adicionar item</button>}</div>
      <div className="mt-4 space-y-3">{proposal.investmentItems.map((item,index) => <div key={item.id} className="grid gap-2 rounded-xl border border-white/10 p-3 md:grid-cols-[2fr_.6fr_1fr_1fr_auto]">
        <input disabled={locked} className={input} value={item.description} onChange={event => { const items=[...proposal.investmentItems]; items[index]={...item,description:event.target.value}; setProposal({...proposal,investmentItems:items}); }} placeholder="Descrição"/>
        <input disabled={locked} className={input} type="number" min="0" step="1" value={item.quantity} onChange={event => { const items=[...proposal.investmentItems]; items[index]={...item,quantity:Number(event.target.value)}; setProposal({...proposal,investmentItems:items}); }}/>
        <input disabled={locked} className={input} type="number" min="0" step="0.01" value={item.unitValue} onChange={event => { const items=[...proposal.investmentItems]; items[index]={...item,unitValue:Number(event.target.value)}; setProposal({...proposal,investmentItems:items}); }}/>
        <select disabled={locked} className={input} value={item.billingType} onChange={event => { const billingType=event.target.value as "one_time"|"recurring"; const items=[...proposal.investmentItems]; items[index]={...item,billingType,recurrence:billingType==="recurring"?"monthly":null}; setProposal({...proposal,investmentItems:items}); }}><option value="one_time">Único</option><option value="recurring">Recorrente</option></select>
        {!locked && <button onClick={() => setProposal({...proposal,investmentItems:proposal.investmentItems.filter((_,itemIndex)=>itemIndex!==index)})} className="rounded-lg border border-rose-300/20 px-3 text-xs text-rose-100">Excluir</button>}
      </div>)}</div>

      <div className="mt-5 grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-white/10 p-4"><p className="text-xs text-white/40">Investimento inicial</p><p className="mt-1 text-lg font-semibold">{money(proposal.total)}</p></div><div className="rounded-xl border border-white/10 p-4"><p className="text-xs text-white/40">Recorrência mensal</p><p className="mt-1 text-lg font-semibold">{money(proposal.recurringMonthly)}/mês</p></div><div className="rounded-xl border border-white/10 p-4"><p className="text-xs text-white/40">Recorrência anual</p><p className="mt-1 text-lg font-semibold">{money(proposal.recurringAnnual)}/ano</p></div></div>
      <div className="mt-4 grid gap-3 md:grid-cols-3"><select disabled={locked} className={input} value={proposal.discountType} onChange={event => setProposal({...proposal,discountType:event.target.value as Proposal["discountType"]})}><option value="none">Sem desconto</option><option value="fixed">Desconto fixo</option><option value="percentage">Desconto percentual</option></select><input disabled={locked} className={input} type="number" min="0" step="0.01" value={proposal.discountValue} onChange={event => setProposal({...proposal,discountValue:Number(event.target.value)})} placeholder="Valor do desconto"/><select disabled={locked || proposal.discountType!=="percentage"} className={input} value={proposal.discountScope ?? "all"} onChange={event => setProposal({...proposal,discountScope:event.target.value as "one_time"|"all"})}><option value="all">% no inicial e recorrente</option><option value="one_time">% somente no inicial</option></select></div>
      {proposal.discountType === "fixed" && <p className="mt-2 text-xs text-white/35">Desconto fixo incide somente sobre o investimento inicial. Para aplicar desconto também à recorrência, utilize percentual.</p>}
    </section>

    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.025] p-5">
      <textarea disabled={locked} className={`${input} min-h-24 w-full`} value={proposal.paymentTerms || ""} onChange={event => setProposal({...proposal,paymentTerms:event.target.value})} placeholder="Condições de pagamento"/>
      <textarea disabled={locked} className={`${input} mt-3 min-h-24 w-full`} value={proposal.commercialConditions || ""} onChange={event => setProposal({...proposal,commercialConditions:event.target.value})} placeholder="Condições comerciais"/>
      <textarea disabled={locked} className={`${input} mt-3 min-h-20 w-full`} value={proposal.observations || ""} onChange={event => setProposal({...proposal,observations:event.target.value})} placeholder="Observações internas"/>
    </section>

    {message && <p className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[.05] p-3 text-sm leading-6 text-amber-100">{message}</p>}
  </div></main>;
}
