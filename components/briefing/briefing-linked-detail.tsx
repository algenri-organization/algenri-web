"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";
import type { BriefingTemplateSnapshot } from "@/lib/briefing/types";

type Detail = {
  id: string;
  clientName: string;
  projectName: string;
  slug: string;
  status: string;
  progress: number;
  templateId: string;
  template: BriefingTemplateSnapshot;
  answers: Record<string, unknown>;
  createdAt: string;
  startedAt: string | null;
  lastSavedAt: string | null;
  completedAt: string | null;
};

async function authFetch(user: User, input: RequestInfo | URL) {
  const token = await user.getIdToken();
  return fetch(input, { headers: { Authorization: `Bearer ${token}` } });
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

function formatDate(value: string | null) {
  if (!value) return "—";
  try { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
  catch { return value; }
}

export default function BriefingLinkedDetail({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => onAuthStateChanged(firebaseAuth, (next) => { setUser(next); setReady(true); }), []);
  useEffect(() => {
    if (!user) return;
    authFetch(user, `/api/internal/briefing/instances/${encodeURIComponent(id)}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error("Não foi possível abrir o briefing.");
        setDetail(payload.briefing);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Falha ao abrir briefing."));
  }, [user, id]);

  const rows = useMemo(() => detail?.template.sections.flatMap((section) => section.questions.map((question) => ({
    section: section.title,
    question: question.label,
    answer: formatAnswer(detail.answers[question.id]),
  }))) ?? [], [detail]);

  if (!ready) return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Carregando…</main>;
  if (!user) return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Faça login em /interno.</main>;
  if (!detail) return <main className="min-h-screen bg-[#040c17] grid place-items-center px-6 text-center text-white">{message || "Carregando briefing…"}</main>;

  return <main className="min-h-screen bg-[#040c17] px-6 py-10 text-white">
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => history.back()} className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"><ArrowLeft size={16}/>Voltar ao projeto</button>
        <a href="/interno/briefings/recebidos" className="inline-flex items-center gap-2 text-sm text-cyan-200 hover:text-cyan-100">Área completa de briefings <ExternalLink size={14}/></a>
      </div>

      <div className="mt-6 border-b border-white/10 pb-6">
        <p className="text-xs font-semibold tracking-[.22em] text-cyan-300">BRIEFING DO PROJETO</p>
        <h1 className="mt-2 text-3xl font-semibold">{detail.projectName}</h1>
        <p className="mt-2 text-sm text-white/45">{detail.clientName} · {detail.template.name} v{detail.template.version}</p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><p className="text-xs text-white/35">Status</p><p className="mt-2 font-medium text-cyan-100">{statusLabel(detail.status)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><p className="text-xs text-white/35">Progresso</p><p className="mt-2 font-medium">{detail.progress}%</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><p className="text-xs text-white/35">Último salvamento</p><p className="mt-2 text-sm">{formatDate(detail.lastSavedAt)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><p className="text-xs text-white/35">Conclusão</p><p className="mt-2 text-sm">{formatDate(detail.completedAt)}</p></div>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6">
        <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-4"><div><p className="text-xs tracking-[.2em] text-violet-200">RESPOSTAS</p><p className="mt-1 text-sm text-white/40">Visualização direta do briefing vinculado ao projeto.</p></div><span className="text-xs text-white/35">{rows.length} perguntas</span></div>
        <div className="mt-5 space-y-5">{detail.template.sections.map((section) => <div key={section.id}><h2 className="text-base font-semibold text-white/85">{section.title}</h2><div className="mt-3 space-y-2">{section.questions.map((question) => <div key={question.id} className="rounded-xl border border-white/[.07] bg-black/15 p-4"><p className="text-sm text-white/65">{question.label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white">{formatAnswer(detail.answers[question.id])}</p></div>)}</div></div>)}</div>
      </section>
    </div>
  </main>;
}
