"use client";

import { useEffect, useMemo, useState } from "react";
import type { BriefingTemplateSnapshot, BriefingQuestion } from "@/lib/briefing/types";
import { isBriefingQuestionVisible } from "@/lib/briefing/progress";

type BriefingPayload = {
  clientName: string;
  projectName: string;
  status: string;
  progress: number;
  lastSavedAt: string | null;
  template: BriefingTemplateSnapshot;
  answers: Record<string, unknown>;
};

function QuestionField({ question, value, onChange, disabled }: { question: BriefingQuestion; value: unknown; onChange: (value: unknown) => void; disabled: boolean }) {
  const base = "mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60 disabled:opacity-60";
  if (question.type === "long_text") return <textarea rows={4} disabled={disabled} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={base} />;
  if (question.type === "yes_no") return <select disabled={disabled} value={value === true ? "yes" : value === false ? "no" : ""} onChange={(e) => onChange(e.target.value === "yes" ? true : e.target.value === "no" ? false : "")} className={base}><option value="">Selecione</option><option value="yes">Sim</option><option value="no">Não</option></select>;
  if (question.type === "single_choice") return <select disabled={disabled} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={base}><option value="">Selecione</option>{(question.options ?? []).map((option) => <option key={option}>{option}</option>)}</select>;
  if (question.type === "multiple_choice") {
    const selected = Array.isArray(value) ? value as string[] : [];
    return <div className="mt-3 grid gap-2">{(question.options ?? []).map((option) => <label key={option} className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" disabled={disabled} checked={selected.includes(option)} onChange={(e) => onChange(e.target.checked ? [...selected, option] : selected.filter((item) => item !== option))} />{option}</label>)}</div>;
  }
  if (question.type === "consent") return <label className="mt-3 flex items-start gap-3 text-sm text-slate-300"><input type="checkbox" disabled={disabled} checked={value === true} onChange={(e) => onChange(e.target.checked)} className="mt-1" /><span>{question.helperText || "Declaro que li e concordo."}</span></label>;
  if (question.type === "file_upload") return <p className="mt-2 rounded-xl border border-dashed border-white/10 p-3 text-xs text-slate-400">Upload de arquivo será habilitado na próxima evolução deste fluxo.</p>;
  const htmlType = question.type === "email" ? "email" : question.type === "url" ? "url" : question.type === "date" ? "date" : question.type === "number" || question.type === "currency" ? "number" : question.type === "phone" ? "tel" : "text";
  return <input type={htmlType} disabled={disabled} value={String(value ?? "")} onChange={(e) => onChange(htmlType === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value)} className={base} />;
}

export default function PublicBriefingForm({ slug, token }: { slug: string; token: string }) {
  const [briefing, setBriefing] = useState<BriefingPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/briefing/${encodeURIComponent(slug)}`, { headers: { "x-briefing-token": token } })
      .then(async (response) => { if (!response.ok) throw new Error("Acesso inválido ou expirado."); return response.json(); })
      .then((payload) => { setBriefing(payload.briefing); setAnswers(payload.briefing.answers ?? {}); })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Não foi possível carregar o briefing."))
      .finally(() => setLoading(false));
  }, [slug, token]);

  const sections = briefing?.template.sections ?? [];
  const section = sections[currentSection];
  const visibleQuestions = useMemo(() => section?.questions.filter((question) => isBriefingQuestionVisible(question, answers)) ?? [], [section, answers]);
  const locked = briefing?.status === "completed" || briefing?.status === "archived";
  const progress = briefing?.progress ?? 0;
  const requiredMissing = useMemo(() => visibleQuestions.filter((q) => q.required && (answers[q.id] === undefined || answers[q.id] === null || answers[q.id] === "" || (Array.isArray(answers[q.id]) && (answers[q.id] as unknown[]).length === 0))), [visibleQuestions, answers]);

  async function save() {
    setSaving(true); setMessage("");
    try {
      const response = await fetch(`/api/briefing/${encodeURIComponent(slug)}`, { method: "PATCH", headers: { "Content-Type": "application/json", "x-briefing-token": token }, body: JSON.stringify({ answers }) });
      const payload = await response.json();
      if (!response.ok) throw new Error("Não foi possível salvar agora.");
      setBriefing((current) => current ? { ...current, progress: payload.progress, status: payload.status, lastSavedAt: payload.lastSavedAt } : current);
      setMessage("Respostas salvas com sucesso.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha ao salvar."); }
    finally { setSaving(false); }
  }

  async function next() { await save(); if (requiredMissing.length) { setMessage("Preencha as perguntas obrigatórias desta etapa antes de avançar."); return; } setCurrentSection((value) => Math.min(value + 1, sections.length - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function complete() {
    await save();
    const response = await fetch(`/api/briefing/${encodeURIComponent(slug)}`, { method: "POST", headers: { "x-briefing-token": token } });
    const payload = await response.json();
    if (!response.ok) { setMessage(payload.error === "required_answers_missing" ? "Ainda existem perguntas obrigatórias sem resposta." : "Não foi possível concluir o briefing."); return; }
    setBriefing((current) => current ? { ...current, status: "completed", progress: 100 } : current);
    setMessage("Briefing concluído e enviado à ALGENRI. Obrigado!");
  }

  if (loading) return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Carregando briefing…</main>;
  if (!briefing || !section) return <main className="min-h-screen bg-[#040c17] grid place-items-center px-6 text-center text-white"><p>{message || "Briefing indisponível."}</p></main>;

  return <main className="min-h-screen bg-[#040c17] text-white">
    <header className="border-b border-white/10 bg-[#06111f]/95 px-6 py-5"><div className="mx-auto max-w-5xl"><p className="text-xs font-semibold tracking-[0.25em] text-cyan-300">ALGENRI CLIENT FLOW</p><div className="mt-2 flex flex-col justify-between gap-2 md:flex-row md:items-end"><div><h1 className="text-2xl font-semibold">{briefing.projectName}</h1><p className="mt-1 text-sm text-slate-400">{briefing.clientName}</p></div><p className="text-sm text-slate-400">{progress}% concluído</p></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-cyan-300 transition-all" style={{ width: `${progress}%` }} /></div></div></header>
    <div className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-2">{sections.map((item, index) => <button key={item.id} onClick={() => setCurrentSection(index)} className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${index === currentSection ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100" : "border-white/5 bg-white/[0.025] text-slate-400"}`}><span className="mr-2 text-xs">{index + 1}.</span>{item.title}</button>)}</aside>
      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 md:p-8"><p className="text-xs text-cyan-300">Etapa {currentSection + 1} de {sections.length}</p><h2 className="mt-2 text-2xl font-semibold">{section.title}</h2>{section.description && <p className="mt-2 text-sm leading-6 text-slate-400">{section.description}</p>}
        <div className="mt-8 space-y-7">{visibleQuestions.map((question) => <label key={question.id} className="block"><span className="text-sm font-medium text-slate-100">{question.label}{question.required && <span className="ml-1 text-cyan-300">*</span>}</span>{question.helperText && question.type !== "consent" && <p className="mt-1 text-xs leading-5 text-slate-500">{question.helperText}</p>}<QuestionField question={question} value={answers[question.id]} disabled={locked} onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))} /></label>)}</div>
        {message && <p className="mt-6 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] px-4 py-3 text-sm text-cyan-100">{message}</p>}
        <div className="mt-8 flex flex-wrap justify-between gap-3"><button disabled={currentSection === 0} onClick={() => setCurrentSection((value) => Math.max(0, value - 1))} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm disabled:opacity-30">Anterior</button><div className="flex gap-2"><button disabled={saving || locked} onClick={save} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm disabled:opacity-50">{saving ? "Salvando…" : "Salvar e continuar depois"}</button>{currentSection < sections.length - 1 ? <button disabled={saving || locked} onClick={next} className="rounded-xl bg-cyan-300 px-5 py-2.5 font-semibold text-slate-950 disabled:opacity-50">Próxima etapa</button> : <button disabled={saving || locked} onClick={complete} className="rounded-xl bg-cyan-300 px-5 py-2.5 font-semibold text-slate-950 disabled:opacity-50">Concluir briefing</button>}</div></div>
      </section>
    </div>
  </main>;
}
