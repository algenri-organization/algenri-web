"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Copy, Download, ExternalLink, Link2, MessageCircle, RefreshCcw, RotateCcw, Sparkles } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";
import type { BriefingTemplateSnapshot } from "@/lib/briefing/types";

type InstanceSummary = {
  id: string;
  clientName: string;
  projectName: string;
  slug: string;
  status: string;
  progress: number;
  createdAt: string;
  startedAt: string | null;
  lastSavedAt: string | null;
  completedAt: string | null;
  templateName: string;
  templateVersion: string;
};

type Detail = InstanceSummary & {
  templateId: string;
  template: BriefingTemplateSnapshot;
  answers: Record<string, unknown>;
};

type TemplateSummary = {
  id: string;
  name: string;
  projectType: string;
  version: string;
  status: string;
};

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(input, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } });
}

function statusLabel(status: string) {
  if (status === "not_started") return "Não iniciado";
  if (status === "in_progress") return "Em andamento";
  if (status === "completed") return "Concluído";
  if (status === "archived") return "Arquivado";
  return status;
}

function formatAnswer(value: unknown) {
  if (value === true) return "Sim";
  if (value === false) return "Não";
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function BriefingReceivedAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [instances, setInstances] = useState<InstanceSummary[]>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [message, setMessage] = useState("");
  const [resetting, setResetting] = useState(false);
  const [refreshingTemplate, setRefreshingTemplate] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [accessLink, setAccessLink] = useState("");

  useEffect(() => onAuthStateChanged(firebaseAuth, (next) => { setUser(next); setReady(true); }), []);

  async function loadList(activeUser = user) {
    if (!activeUser) return;
    const response = await authFetch(activeUser, "/api/internal/briefing/instances");
    const payload = await response.json();
    if (!response.ok) throw new Error("Não foi possível carregar os briefings.");
    setInstances(payload.instances ?? []);
  }

  async function loadTemplates(activeUser = user) {
    if (!activeUser) return;
    const response = await authFetch(activeUser, "/api/internal/briefing/templates");
    const payload = await response.json();
    if (!response.ok) throw new Error("Não foi possível carregar os modelos publicados.");
    setTemplates((payload.templates ?? []).filter((template: TemplateSummary) => template.status === "published"));
  }

  useEffect(() => {
    if (!user) return;
    Promise.all([loadList(user), loadTemplates(user)]).catch((error) => setMessage(error instanceof Error ? error.message : "Falha ao carregar dados."));
  }, [user]);

  async function openDetail(id: string) {
    if (!user) return;
    setSelectedId(id);
    setAccessLink("");
    setMessage("");
    try {
      const response = await authFetch(user, `/api/internal/briefing/instances/${encodeURIComponent(id)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error("Não foi possível abrir as respostas.");
      setDetail(payload.briefing);
      setSelectedTemplateId(payload.briefing.templateId ?? "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao abrir respostas.");
    }
  }

  async function resetBriefing() {
    if (!user || !detail || resetting) return;
    const confirmed = window.confirm(`Reiniciar o briefing de ${detail.clientName}? Todas as respostas serão apagadas e o progresso voltará a 0%. O modelo atual e o mesmo link serão preservados.`);
    if (!confirmed || !window.confirm("Confirma a exclusão definitiva das respostas salvas desta instância?")) return;

    setResetting(true); setMessage("");
    try {
      const response = await authFetch(user, `/api/internal/briefing/instances/${encodeURIComponent(detail.id)}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error === "briefing_not_found" ? "Briefing não encontrado." : "Não foi possível reiniciar o briefing.");
      await loadList(user);
      await openDetail(detail.id);
      setMessage("Briefing reiniciado. Respostas apagadas e progresso zerado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao reiniciar briefing.");
    } finally {
      setResetting(false);
    }
  }

  async function refreshTemplateAndReset() {
    if (!user || !detail || !selectedTemplateId || refreshingTemplate) return;
    const selected = templates.find((template) => template.id === selectedTemplateId);
    const name = selected ? `${selected.name} v${selected.version}` : "o modelo selecionado";
    const confirmed = window.confirm(`Atualizar o briefing de ${detail.clientName} para ${name}? Isso substituirá a estrutura do questionário e apagará todas as respostas atuais, preservando o mesmo slug/token de acesso.`);
    if (!confirmed || !window.confirm("Confirma a atualização do modelo e a limpeza definitiva das respostas?")) return;

    setRefreshingTemplate(true); setMessage("");
    try {
      const response = await authFetch(user, `/api/internal/briefing/instances/${encodeURIComponent(detail.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selectedTemplateId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        if (payload.error === "template_not_published") throw new Error("O modelo selecionado não está publicado.");
        if (payload.error === "template_not_found") throw new Error("Modelo não encontrado.");
        throw new Error("Não foi possível atualizar o modelo do briefing.");
      }
      await loadList(user);
      await openDetail(detail.id);
      setMessage(`Briefing atualizado para ${payload.templateName} v${payload.templateVersion}, sem respostas e com 0% de progresso.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao atualizar o modelo do briefing.");
    } finally {
      setRefreshingTemplate(false);
    }
  }

  async function generateAccessLink() {
    if (!user || !detail || generatingLink) return;
    const confirmed = window.confirm(`Gerar um novo link de acesso para ${detail.clientName}? Por segurança, qualquer link anterior deixará de funcionar.`);
    if (!confirmed) return;

    setGeneratingLink(true);
    setMessage("");
    try {
      const response = await authFetch(user, `/api/internal/briefing/instances/${encodeURIComponent(detail.id)}`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok || typeof payload.token !== "string" || typeof payload.slug !== "string") {
        throw new Error("Não foi possível gerar o link de acesso.");
      }
      const link = `${window.location.origin}/briefing/${encodeURIComponent(payload.slug)}?token=${encodeURIComponent(payload.token)}`;
      setAccessLink(link);
      setMessage("Novo link gerado. Copie ou compartilhe agora: por segurança, o token não poderá ser exibido novamente depois que você sair desta tela.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao gerar link de acesso.");
    } finally {
      setGeneratingLink(false);
    }
  }

  async function copyAccessLink() {
    if (!accessLink) return;
    try {
      await navigator.clipboard.writeText(accessLink);
      setMessage("Link copiado. Já pode ser enviado à cliente.");
    } catch {
      setMessage("Não foi possível copiar automaticamente. Selecione o link exibido e copie manualmente.");
    }
  }

  function openAccessLink() {
    if (!accessLink) return;
    window.open(accessLink, "_blank", "noopener,noreferrer");
  }

  function shareOnWhatsApp() {
    if (!accessLink || !detail) return;
    const text = `Olá! Segue o link para preenchimento do briefing do projeto ${detail.projectName}:\n\n${accessLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  const rows = useMemo(() => detail?.template.sections.flatMap((section) => section.questions.map((question) => ({
    section: section.title,
    question: question.label,
    answer: formatAnswer(detail.answers[question.id]),
  }))) ?? [], [detail]);

  function exportCsv() {
    if (!detail) return;
    const lines = [["Seção", "Pergunta", "Resposta"], ...rows.map((row) => [row.section, row.question, row.answer])]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + lines], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `briefing-${detail.slug}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!ready) return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Carregando…</main>;
  if (!user) return <main className="min-h-screen bg-[#040c17] grid place-items-center px-6 text-center text-white"><p>Faça login primeiro em <strong>/interno</strong>.</p></main>;

  return <main className="min-h-screen bg-[#040c17] text-white">
    <header className="border-b border-white/10 bg-[#06111f]/90 px-6 py-5"><div className="mx-auto max-w-6xl"><p className="text-xs font-semibold tracking-[0.25em] text-cyan-300">ALGENRI CLIENT FLOW</p><div className="mt-1 flex items-center justify-between gap-4"><h1 className="text-2xl font-semibold">Briefings recebidos</h1><button onClick={() => Promise.all([loadList(), loadTemplates()]).catch(() => setMessage("Falha ao atualizar dados."))} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"><RefreshCcw size={15} />Atualizar</button></div></div></header>
    <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[340px_1fr]">
      <aside className="space-y-3">{instances.map((item) => <button key={item.id} onClick={() => openDetail(item.id)} className={`w-full rounded-2xl border p-4 text-left ${selectedId === item.id ? "border-cyan-400/40 bg-cyan-400/10" : "border-white/10 bg-white/[0.025]"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{item.clientName}</p><p className="mt-1 text-sm text-slate-400">{item.projectName}</p></div><span className="text-xs text-cyan-200">{item.progress}%</span></div><div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>{statusLabel(item.status)}</span><span>v{item.templateVersion}</span></div></button>)}{instances.length === 0 && <p className="text-sm text-slate-400">Nenhuma instância encontrada.</p>}</aside>
      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 md:p-8">{detail ? <><div className="border-b border-white/10 pb-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><p className="text-xs text-cyan-300">{statusLabel(detail.status)} · {detail.progress}% respondido</p><h2 className="mt-2 text-2xl font-semibold">{detail.projectName}</h2><p className="mt-1 text-sm text-slate-400">{detail.clientName} · {detail.template.name} v{detail.template.version}</p></div><div className="flex flex-wrap gap-2"><button onClick={resetBriefing} disabled={resetting} className="flex items-center gap-2 rounded-xl border border-rose-300/20 px-4 py-2.5 text-sm text-rose-100 disabled:opacity-50"><RotateCcw size={16} />{resetting ? "Reiniciando…" : "Reiniciar"}</button><button onClick={exportCsv} className="flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950"><Download size={16} />Exportar CSV</button></div></div>
        <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-4"><div className="flex items-start gap-3"><Link2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-cyan-100">Link para a cliente</p><p className="mt-1 text-xs leading-5 text-white/50">Gere um link seguro para enviar à cliente. Cada novo link invalida o anterior. O token é exibido somente nesta sessão.</p>{accessLink ? <><div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5"><p className="break-all select-all text-xs leading-5 text-cyan-50">{accessLink}</p></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={copyAccessLink} className="flex items-center gap-2 rounded-xl bg-cyan-300 px-3.5 py-2.5 text-sm font-semibold text-slate-950"><Copy size={15} />Copiar link</button><button onClick={openAccessLink} className="flex items-center gap-2 rounded-xl border border-white/15 px-3.5 py-2.5 text-sm text-white"><ExternalLink size={15} />Abrir para teste</button><button onClick={shareOnWhatsApp} className="flex items-center gap-2 rounded-xl border border-emerald-300/25 px-3.5 py-2.5 text-sm text-emerald-100"><MessageCircle size={15} />WhatsApp</button></div></> : <button onClick={generateAccessLink} disabled={generatingLink} className="mt-3 flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"><Link2 size={15} />{generatingLink ? "Gerando…" : "Gerar novo link de acesso"}</button>}</div></div></div>
        <div className="mt-4 rounded-2xl border border-violet-300/15 bg-violet-300/[0.04] p-4"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-violet-200" /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-violet-100">Atualizar estrutura antes de entregar ao cliente</p><p className="mt-1 text-xs leading-5 text-white/45">Escolha um modelo publicado. A estrutura e a versão da instância serão atualizadas, as respostas serão zeradas e o mesmo slug/token continuará válido.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm text-white"><option value="">Selecione um modelo publicado</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name} — v{template.version}</option>)}</select><button onClick={refreshTemplateAndReset} disabled={!selectedTemplateId || refreshingTemplate} className="rounded-xl border border-violet-300/25 px-4 py-2.5 text-sm text-violet-100 disabled:opacity-40">{refreshingTemplate ? "Atualizando…" : "Atualizar modelo e zerar"}</button></div></div></div></div>
      </div><div className="mt-6 space-y-7">{detail.template.sections.map((section) => <div key={section.id}><h3 className="text-lg font-semibold text-cyan-100">{section.title}</h3><div className="mt-3 space-y-3">{section.questions.map((question) => <div key={question.id} className="rounded-xl border border-white/5 bg-black/10 p-4"><p className="text-sm font-medium text-slate-200">{question.label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">{formatAnswer(detail.answers[question.id])}</p></div>)}</div></div>)}</div></> : <div className="grid min-h-[420px] place-items-center text-center text-slate-500"><p>Selecione um briefing para visualizar as respostas.</p></div>}{message && <p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-100">{message}</p>}</section>
    </div>
  </main>;
}
