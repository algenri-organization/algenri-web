"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Download, RefreshCcw, RotateCcw } from "lucide-react";
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
  template: BriefingTemplateSnapshot;
  answers: Record<string, unknown>;
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
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [message, setMessage] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, (next) => { setUser(next); setReady(true); }), []);

  async function loadList(activeUser = user) {
    if (!activeUser) return;
    setMessage("");
    try {
      const response = await authFetch(activeUser, "/api/internal/briefing/instances");
      const payload = await response.json();
      if (!response.ok) throw new Error("Não foi possível carregar os briefings.");
      setInstances(payload.instances ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao carregar briefings.");
    }
  }

  useEffect(() => { if (user) void loadList(user); }, [user]);

  async function openDetail(id: string) {
    if (!user) return;
    setSelectedId(id); setMessage("");
    try {
      const response = await authFetch(user, `/api/internal/briefing/instances/${encodeURIComponent(id)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error("Não foi possível abrir as respostas.");
      setDetail(payload.briefing);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao abrir respostas.");
    }
  }

  async function resetBriefing() {
    if (!user || !detail || resetting) return;
    const confirmed = window.confirm(`Reiniciar o briefing de ${detail.clientName}? Todas as respostas de teste serão apagadas, o progresso voltará a 0% e o mesmo projeto/link continuará existindo.`);
    if (!confirmed) return;
    const second = window.confirm("Confirma a exclusão definitiva das respostas salvas desta instância?");
    if (!second) return;

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
    <header className="border-b border-white/10 bg-[#06111f]/90 px-6 py-5"><div className="mx-auto max-w-6xl"><p className="text-xs font-semibold tracking-[0.25em] text-cyan-300">ALGENRI CLIENT FLOW</p><div className="mt-1 flex items-center justify-between gap-4"><h1 className="text-2xl font-semibold">Briefings recebidos</h1><button onClick={() => loadList()} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"><RefreshCcw size={15} />Atualizar</button></div></div></header>
    <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[340px_1fr]">
      <aside className="space-y-3">{instances.map((item) => <button key={item.id} onClick={() => openDetail(item.id)} className={`w-full rounded-2xl border p-4 text-left ${selectedId === item.id ? "border-cyan-400/40 bg-cyan-400/10" : "border-white/10 bg-white/[0.025]"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{item.clientName}</p><p className="mt-1 text-sm text-slate-400">{item.projectName}</p></div><span className="text-xs text-cyan-200">{item.progress}%</span></div><div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>{statusLabel(item.status)}</span><span>v{item.templateVersion}</span></div></button>)}{instances.length === 0 && <p className="text-sm text-slate-400">Nenhuma instância encontrada.</p>}</aside>
      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 md:p-8">{detail ? <><div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start"><div><p className="text-xs text-cyan-300">{statusLabel(detail.status)} · {detail.progress}% respondido</p><h2 className="mt-2 text-2xl font-semibold">{detail.projectName}</h2><p className="mt-1 text-sm text-slate-400">{detail.clientName} · {detail.template.name} v{detail.template.version}</p>{detail.completedAt && <p className="mt-2 text-xs text-slate-500">Concluído em {new Date(detail.completedAt).toLocaleString("pt-BR")}</p>}</div><div className="flex flex-wrap gap-2"><button onClick={resetBriefing} disabled={resetting} className="flex items-center gap-2 rounded-xl border border-rose-300/20 px-4 py-2.5 text-sm text-rose-100 disabled:opacity-50"><RotateCcw size={16} />{resetting ? "Reiniciando…" : "Reiniciar briefing"}</button><button onClick={exportCsv} className="flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950"><Download size={16} />Exportar CSV</button></div></div><div className="mt-6 space-y-7">{detail.template.sections.map((section) => <div key={section.id}><h3 className="text-lg font-semibold text-cyan-100">{section.title}</h3><div className="mt-3 space-y-3">{section.questions.map((question) => <div key={question.id} className="rounded-xl border border-white/5 bg-black/10 p-4"><p className="text-sm font-medium text-slate-200">{question.label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">{formatAnswer(detail.answers[question.id])}</p></div>)}</div></div>)}</div></> : <div className="grid min-h-[420px] place-items-center text-center text-slate-500"><p>Selecione um briefing para visualizar as respostas.</p></div>}{message && <p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-100">{message}</p>}</section>
    </div>
  </main>;
}
