"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Archive, FilePenLine, FileText, Plus, Save, Send } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Model = {
  id: string;
  name: string;
  type: "proposal" | "contract" | "general";
  status: "draft" | "published" | "archived";
  content: string;
  notes: string;
  version: number;
  updatedAt: string;
};

const blank = { name: "", type: "general", status: "draft", content: "", notes: "" };
const typeLabels: Record<string, string> = { proposal: "Proposta", contract: "Contrato", general: "Documento geral" };
const statusLabels: Record<string, string> = { draft: "Rascunho", published: "Publicado", archived: "Arquivado" };

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(input, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` }, cache: "no-store" });
}

export default function DocumentModelsAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<any>(blank);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("active");

  useEffect(() => onAuthStateChanged(firebaseAuth, setUser), []);
  useEffect(() => { if (user) load(user); }, [user]);

  async function load(active: User) {
    const response = await authFetch(active, "/api/internal/settings/document-models");
    const payload = await response.json();
    if (!response.ok) { setMessage("Não foi possível carregar os modelos de documentos."); return; }
    setModels(payload.models ?? []);
  }

  const visible = useMemo(() => models.filter((model) => filter === "all" || (filter === "active" ? model.status !== "archived" : model.status === filter)), [models, filter]);

  function edit(model?: Model) {
    if (!model) { setEditingId(""); setForm(blank); setMessage(""); return; }
    setEditingId(model.id);
    setForm({ name: model.name, type: model.type, status: model.status, content: model.content, notes: model.notes ?? "" });
    setMessage("");
  }

  async function save(statusOverride?: "draft" | "published" | "archived") {
    if (!user) return;
    setSaving(true); setMessage("");
    try {
      const method = editingId ? "PATCH" : "POST";
      const body = { ...form, status: statusOverride ?? form.status, ...(editingId ? { id: editingId } : {}) };
      const response = await authFetch(user, "/api/internal/settings/document-models", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        const errors: Record<string, string> = {
          model_name_required: "Informe o nome do modelo.",
          model_content_required: "Inclua o conteúdo do modelo.",
        };
        setMessage(errors[payload.error] ?? "Não foi possível salvar o modelo.");
        return;
      }
      setEditingId(payload.model.id);
      setForm({ name: payload.model.name, type: payload.model.type, status: payload.model.status, content: payload.model.content, notes: payload.model.notes ?? "" });
      setMessage(statusOverride === "published" ? "Modelo publicado e disponível para uso futuro." : statusOverride === "archived" ? "Modelo arquivado sem excluir o histórico." : "Modelo salvo com sucesso.");
      await load(user);
    } finally { setSaving(false); }
  }

  if (!user) return null;

  return <div className="grid gap-6 xl:grid-cols-[.9fr_1.4fr]">
    <section className="rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Biblioteca</h2><p className="mt-1 text-sm text-white/40">Modelos reutilizáveis e versionados.</p></div><button onClick={() => edit()} className="flex items-center gap-2 rounded-xl bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950"><Plus className="h-4 w-4" />Novo modelo</button></div>
      <div className="mt-4 flex flex-wrap gap-2">{["active","draft","published","archived","all"].map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1.5 text-xs ${filter === item ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-white/10 text-white/45"}`}>{item === "active" ? "Ativos" : item === "all" ? "Todos" : statusLabels[item]}</button>)}</div>
      <div className="mt-4 space-y-2.5">{visible.length ? visible.map((model) => <button key={model.id} onClick={() => edit(model)} className={`w-full rounded-2xl border p-4 text-left transition ${editingId === model.id ? "border-cyan-300/30 bg-cyan-300/[.06]" : "border-white/10 bg-black/10 hover:border-white/20"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{model.name}</p><p className="mt-1 text-xs text-white/40">{typeLabels[model.type]} · v{model.version}</p></div><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/50">{statusLabels[model.status]}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-white/35">{model.content}</p></button>) : <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/35">Nenhum modelo nesta visualização.</div>}</div>
    </section>

    <section className="rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6">
      <div className="flex items-center gap-3"><div className="rounded-xl border border-violet-300/15 bg-violet-300/[.06] p-2"><FilePenLine className="h-5 w-5 text-violet-200" /></div><div><h2 className="font-semibold">{editingId ? "Editar modelo" : "Novo modelo"}</h2><p className="mt-1 text-sm text-white/40">Use texto-base e marcadores como [CLIENTE], [PROJETO], [DATA] e [VALOR].</p></div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><input value={form.name} onChange={(e) => setForm((f:any) => ({ ...f, name: e.target.value }))} placeholder="Nome do modelo" className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none" /><select value={form.type} onChange={(e) => setForm((f:any) => ({ ...f, type: e.target.value }))} className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none"><option value="general">Documento geral</option><option value="proposal">Proposta</option><option value="contract">Contrato</option></select></div>
      <textarea value={form.content} onChange={(e) => setForm((f:any) => ({ ...f, content: e.target.value }))} placeholder="Conteúdo do modelo" rows={18} className="mt-3 w-full rounded-2xl border border-white/10 bg-[#071423] px-4 py-3 text-sm leading-6 outline-none" />
      <textarea value={form.notes} onChange={(e) => setForm((f:any) => ({ ...f, notes: e.target.value }))} placeholder="Notas internas sobre uso e revisão" rows={3} className="mt-3 w-full rounded-2xl border border-white/10 bg-[#071423] px-4 py-3 text-sm leading-6 outline-none" />
      {message && <p className="mt-4 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/65">{message}</p>}
      <div className="mt-4 flex flex-wrap justify-end gap-2"><button disabled={saving} onClick={() => save("draft")} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm disabled:opacity-40"><Save className="h-4 w-4" />Salvar rascunho</button>{editingId && <button disabled={saving} onClick={() => save("archived")} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 disabled:opacity-40"><Archive className="h-4 w-4" />Arquivar</button>}<button disabled={saving} onClick={() => save("published")} className="flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-40"><Send className="h-4 w-4" />Publicar</button></div>
      <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4 text-cyan-300" />Próxima integração</div><p className="mt-2 text-xs leading-5 text-white/38">A biblioteca foi preparada para que propostas e contratos possam selecionar um modelo publicado em uma próxima etapa, sem misturar essa evolução com os fluxos já operacionais.</p></div>
    </section>
  </div>;
}
