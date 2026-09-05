"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  FileText,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";
import type {
  BriefingQuestion,
  BriefingSection,
  BriefingTemplateRecord,
  QuestionType,
  TemplateStatus,
} from "@/lib/briefing/types";

type TemplateSummary = {
  id: string;
  name: string;
  projectType: string;
  version: string;
  status: TemplateStatus;
  sectionCount: number;
  questionCount: number;
  updatedAt: string;
  createdBy: string;
};

const QUESTION_TYPES: Array<{ value: QuestionType; label: string }> = [
  { value: "short_text", label: "Texto curto" },
  { value: "long_text", label: "Texto longo" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "url", label: "URL" },
  { value: "number", label: "Número" },
  { value: "currency", label: "Moeda" },
  { value: "date", label: "Data" },
  { value: "yes_no", label: "Sim / Não" },
  { value: "single_choice", label: "Escolha única" },
  { value: "multiple_choice", label: "Múltipla escolha" },
  { value: "file_upload", label: "Upload de arquivo" },
  { value: "consent", label: "Consentimento" },
];

const STATUS_LABELS: Record<TemplateStatus, string> = {
  draft: "Rascunho",
  review: "Em revisão",
  published: "Publicado",
  archived: "Arquivado",
};

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeOrders(sections: BriefingSection[]) {
  return sections.map((section, sectionIndex) => ({
    ...section,
    order: sectionIndex,
    questions: section.questions.map((question, questionIndex) => ({ ...question, order: questionIndex })),
  }));
}

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(input, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

export default function BriefingTemplateAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [selected, setSelected] = useState<BriefingTemplateRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => onAuthStateChanged(firebaseAuth, (nextUser) => {
    setUser(nextUser);
    setAuthReady(true);
  }), []);

  const loadTemplates = useCallback(async (currentUser: User) => {
    const response = await authFetch(currentUser, "/api/internal/briefing/templates");
    if (!response.ok) throw new Error("Não foi possível carregar os modelos.");
    const payload = await response.json();
    setTemplates(payload.templates ?? []);
  }, []);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setSelected(null);
      return;
    }
    loadTemplates(user).catch((error) => setMessage(error instanceof Error ? error.message : "Falha ao carregar modelos."));
  }, [user, loadTemplates]);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setAuthError("");
    setBusy(true);
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      if (!credential.user.email?.toLowerCase().endsWith("@algenri.com.br")) {
        await signOut(firebaseAuth);
        setAuthError("Este acesso é exclusivo para contas internas da ALGENRI.");
      }
    } catch {
      setAuthError("E-mail ou senha inválidos.");
    } finally {
      setBusy(false);
    }
  }

  async function openTemplate(id: string) {
    if (!user) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await authFetch(user, `/api/internal/briefing/templates/${id}`);
      if (!response.ok) throw new Error("Não foi possível abrir o modelo.");
      const payload = await response.json();
      setSelected(payload.template);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao abrir o modelo.");
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage("");

    try {
      const response = await authFetch(user, "/api/internal/briefing/templates/import", {
        method: "POST",
        body: data,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error === "no_questions_detected" ? "Nenhuma pergunta foi detectada no DOCX." : "Falha ao importar o DOCX.");

      await loadTemplates(user);
      await openTemplate(payload.templateId);
      form.reset();
      setMessage(`Modelo importado: ${payload.sectionCount} seções e ${payload.questionCount} perguntas.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao importar o DOCX.");
    } finally {
      setBusy(false);
    }
  }

  function patchSelected(patch: Partial<BriefingTemplateRecord>) {
    setSelected((current) => current ? { ...current, ...patch } : current);
  }

  function patchSection(sectionIndex: number, patch: Partial<BriefingSection>) {
    if (!selected) return;
    const sections = selected.sections.map((section, index) => index === sectionIndex ? { ...section, ...patch } : section);
    patchSelected({ sections: normalizeOrders(sections) });
  }

  function patchQuestion(sectionIndex: number, questionIndex: number, patch: Partial<BriefingQuestion>) {
    if (!selected) return;
    const sections = selected.sections.map((section, index) => {
      if (index !== sectionIndex) return section;
      return {
        ...section,
        questions: section.questions.map((question, qIndex) => qIndex === questionIndex ? { ...question, ...patch } : question),
      };
    });
    patchSelected({ sections: normalizeOrders(sections) });
  }

  function moveSection(index: number, direction: -1 | 1) {
    if (!selected) return;
    const target = index + direction;
    if (target < 0 || target >= selected.sections.length) return;
    const sections = [...selected.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    patchSelected({ sections: normalizeOrders(sections) });
  }

  function moveQuestion(sectionIndex: number, questionIndex: number, direction: -1 | 1) {
    if (!selected) return;
    const sections = selected.sections.map((section, index) => {
      if (index !== sectionIndex) return section;
      const questions = [...section.questions];
      const target = questionIndex + direction;
      if (target < 0 || target >= questions.length) return section;
      [questions[questionIndex], questions[target]] = [questions[target], questions[questionIndex]];
      return { ...section, questions };
    });
    patchSelected({ sections: normalizeOrders(sections) });
  }

  function addQuestion(sectionIndex: number) {
    if (!selected) return;
    const sections = selected.sections.map((section, index) => index === sectionIndex ? {
      ...section,
      questions: [...section.questions, {
        id: uid("q"),
        label: "Nova pergunta",
        type: "long_text" as QuestionType,
        required: false,
        order: section.questions.length,
      }],
    } : section);
    patchSelected({ sections: normalizeOrders(sections) });
  }

  function removeQuestion(sectionIndex: number, questionIndex: number) {
    if (!selected) return;
    const sections = selected.sections.map((section, index) => index === sectionIndex ? {
      ...section,
      questions: section.questions.filter((_, qIndex) => qIndex !== questionIndex),
    } : section);
    patchSelected({ sections: normalizeOrders(sections) });
  }

  async function saveTemplate() {
    if (!user || !selected) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await authFetch(user, `/api/internal/briefing/templates/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selected.status,
          template: {
            name: selected.name,
            projectType: selected.projectType,
            version: selected.version,
            privacyNoticeVersion: selected.privacyNoticeVersion,
            sections: normalizeOrders(selected.sections),
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error("Não foi possível salvar o modelo.");
      setSelected(payload.template);
      await loadTemplates(user);
      setMessage("Modelo salvo com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar o modelo.");
    } finally {
      setBusy(false);
    }
  }

  const questionCount = useMemo(() => selected?.sections.reduce((sum, section) => sum + section.questions.length, 0) ?? 0, [selected]);

  if (!authReady) {
    return <div className="min-h-screen bg-[#040c17] text-white grid place-items-center">Carregando acesso seguro…</div>;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#040c17] px-6 py-16 text-white">
        <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300"><ShieldCheck /></div>
            <div><p className="text-xs tracking-[0.28em] text-cyan-300">ALGENRI</p><h1 className="text-2xl font-semibold">Área interna</h1></div>
          </div>
          <p className="mb-6 text-sm leading-6 text-slate-400">Acesso restrito à equipe ALGENRI para gestão de briefings e modelos.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block text-sm text-slate-300">E-mail<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-4 py-3 outline-none focus:border-cyan-400/60" placeholder="voce@algenri.com.br" /></label>
            <label className="block text-sm text-slate-300">Senha<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-4 py-3 outline-none focus:border-cyan-400/60" /></label>
            {authError && <p className="text-sm text-rose-300">{authError}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">Entrar</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#040c17] text-white">
      <header className="border-b border-white/10 bg-[#06111f]/90 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <div><p className="text-xs font-semibold tracking-[0.26em] text-cyan-300">ALGENRI CLIENT FLOW</p><h1 className="mt-1 text-2xl font-semibold">Modelos de Briefing</h1></div>
          <div className="flex items-center gap-3 text-sm text-slate-400"><span className="hidden sm:inline">{user.email}</span><button onClick={() => signOut(firebaseAuth)} className="rounded-xl border border-white/10 p-2.5 hover:bg-white/5" title="Sair"><LogOut size={18} /></button></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-6 py-8 xl:grid-cols-[340px_1fr]">
        <aside className="space-y-5">
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-4 flex items-center gap-2"><Upload size={18} className="text-cyan-300" /><h2 className="font-semibold">Importar DOCX</h2></div>
            <form onSubmit={handleImport} className="space-y-3">
              <input name="name" required placeholder="Nome do modelo" className="w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" />
              <input name="projectType" required placeholder="Tipo de projeto (ex.: ecommerce)" className="w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" />
              <div className="grid grid-cols-2 gap-2"><input name="version" defaultValue="1.0" className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none" /><input name="privacyNoticeVersion" defaultValue="1.0" className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none" /></div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-cyan-400/30 bg-cyan-400/[0.04] px-3 py-4 text-sm text-slate-300"><FileText size={20} className="text-cyan-300" /><span>Selecionar arquivo .docx</span><input name="file" type="file" accept=".docx" required className="hidden" /></label>
              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-50"><Upload size={17} /> Importar modelo</button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <div className="flex items-center justify-between px-2 py-2"><h2 className="font-semibold">Modelos</h2><button onClick={() => loadTemplates(user)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><RefreshCw size={16} /></button></div>
            <div className="mt-2 space-y-2">
              {templates.length === 0 && <p className="px-2 py-5 text-sm text-slate-500">Nenhum modelo importado.</p>}
              {templates.map((template) => <button key={template.id} onClick={() => openTemplate(template.id)} className={`w-full rounded-xl border p-3 text-left transition ${selected?.id === template.id ? "border-cyan-400/50 bg-cyan-400/10" : "border-white/5 bg-white/[0.025] hover:border-white/15"}`}><div className="flex items-start justify-between gap-2"><span className="text-sm font-medium">{template.name}</span><span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-slate-400">{STATUS_LABELS[template.status]}</span></div><p className="mt-2 text-xs text-slate-500">v{template.version} • {template.sectionCount} seções • {template.questionCount} perguntas</p></button>)}
            </div>
          </section>
        </aside>

        <section className="min-w-0">
          {!selected ? (
            <div className="grid min-h-[560px] place-items-center rounded-3xl border border-white/10 bg-white/[0.025] p-8 text-center"><div><FileText className="mx-auto mb-4 text-cyan-300" size={38} /><h2 className="text-xl font-semibold">Selecione ou importe um modelo</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-400">O DOCX será convertido em seções e perguntas editáveis antes da publicação.</p></div></div>
          ) : (
            <div className="space-y-5">
              <div className="sticky top-0 z-20 rounded-2xl border border-white/10 bg-[#071423]/95 p-4 shadow-xl backdrop-blur">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div><p className="text-xs text-slate-500">{selected.sections.length} seções • {questionCount} perguntas</p><h2 className="mt-1 text-xl font-semibold">{selected.name}</h2></div>
                  <div className="flex flex-wrap items-center gap-2"><select value={selected.status} onChange={(e) => patchSelected({ status: e.target.value as TemplateStatus })} className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2 text-sm"><option value="draft">Rascunho</option><option value="review">Em revisão</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select><button onClick={saveTemplate} disabled={busy} className="flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50"><Save size={17} /> Salvar</button></div>
                </div>
                {message && <p className="mt-3 text-sm text-cyan-200">{message}</p>}
              </div>

              <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-4">
                <label className="text-xs text-slate-400 md:col-span-2">Nome<input value={selected.name} onChange={(e) => patchSelected({ name: e.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm text-white" /></label>
                <label className="text-xs text-slate-400">Tipo de projeto<input value={selected.projectType} onChange={(e) => patchSelected({ projectType: e.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm text-white" /></label>
                <label className="text-xs text-slate-400">Versão<input value={selected.version} onChange={(e) => patchSelected({ version: e.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm text-white" /></label>
              </div>

              {selected.source?.warnings?.length > 0 && <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-4 text-sm text-amber-100"><strong>Revisão recomendada:</strong> {selected.source.warnings.join(" • ")}</div>}

              {selected.sections.map((section, sectionIndex) => (
                <article key={section.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
                  <div className="border-b border-white/10 bg-white/[0.025] p-5">
                    <div className="flex gap-3"><div className="flex flex-col gap-1"><button onClick={() => moveSection(sectionIndex, -1)} className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white"><ArrowUp size={15} /></button><button onClick={() => moveSection(sectionIndex, 1)} className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white"><ArrowDown size={15} /></button></div><div className="min-w-0 flex-1"><input value={section.title} onChange={(e) => patchSection(sectionIndex, { title: e.target.value })} className="w-full bg-transparent text-lg font-semibold outline-none" /><input value={section.description ?? ""} onChange={(e) => patchSection(sectionIndex, { description: e.target.value || undefined })} placeholder="Descrição opcional da seção" className="mt-2 w-full bg-transparent text-sm text-slate-400 outline-none" /></div><span className="text-xs text-slate-500">{section.questions.length} perguntas</span></div>
                  </div>
                  <div className="divide-y divide-white/[0.07]">
                    {section.questions.map((question, questionIndex) => (
                      <div key={question.id} className="p-5">
                        <div className="flex gap-3"><div className="flex flex-col gap-1"><button onClick={() => moveQuestion(sectionIndex, questionIndex, -1)} className="rounded p-1 text-slate-600 hover:bg-white/5 hover:text-white"><ArrowUp size={14} /></button><button onClick={() => moveQuestion(sectionIndex, questionIndex, 1)} className="rounded p-1 text-slate-600 hover:bg-white/5 hover:text-white"><ArrowDown size={14} /></button></div><div className="min-w-0 flex-1 space-y-3"><textarea value={question.label} onChange={(e) => patchQuestion(sectionIndex, questionIndex, { label: e.target.value })} rows={2} className="w-full resize-y rounded-xl border border-white/10 bg-[#071423] px-3 py-2 text-sm leading-6 outline-none focus:border-cyan-400/40" /><input value={question.helperText ?? ""} onChange={(e) => patchQuestion(sectionIndex, questionIndex, { helperText: e.target.value || undefined })} placeholder="Texto de apoio / exemplo" className="w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-2 text-xs text-slate-300 outline-none" /><div className="flex flex-wrap items-center gap-3"><select value={question.type} onChange={(e) => patchQuestion(sectionIndex, questionIndex, { type: e.target.value as QuestionType })} className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2 text-xs">{QUESTION_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select><label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={question.required} onChange={(e) => patchQuestion(sectionIndex, questionIndex, { required: e.target.checked })} /> Obrigatória</label>{(question.type === "single_choice" || question.type === "multiple_choice") && <input value={(question.options ?? []).join(" | ")} onChange={(e) => patchQuestion(sectionIndex, questionIndex, { options: e.target.value.split("|").map((v) => v.trim()).filter(Boolean) })} placeholder="Opções separadas por |" className="min-w-[260px] flex-1 rounded-xl border border-white/10 bg-[#071423] px-3 py-2 text-xs" />}</div></div><button onClick={() => removeQuestion(sectionIndex, questionIndex)} className="self-start rounded-lg p-2 text-slate-600 hover:bg-rose-400/10 hover:text-rose-300" title="Excluir pergunta"><Trash2 size={16} /></button></div>
                      </div>
                    ))}
                    <div className="p-4"><button onClick={() => addQuestion(sectionIndex)} className="flex items-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-2 text-sm text-slate-400 hover:border-cyan-400/40 hover:text-cyan-200"><Plus size={16} /> Adicionar pergunta</button></div>
                  </div>
                </article>
              ))}

              <div className="flex items-center justify-between rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4 text-sm text-slate-300"><span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-300" /> O DOCX original permanece arquivado no Storage.</span><button onClick={saveTemplate} disabled={busy} className="rounded-xl border border-white/10 px-4 py-2 hover:bg-white/5">Salvar alterações</button></div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
