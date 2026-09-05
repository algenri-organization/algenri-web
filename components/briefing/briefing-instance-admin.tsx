"use client";

import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Copy, ExternalLink, Link2 } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type TemplateSummary = { id: string; name: string; projectType: string; version: string; status: string };

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(input, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } });
}

export default function BriefingInstanceAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [accessUrl, setAccessUrl] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, (next) => { setUser(next); setReady(true); }), []);
  useEffect(() => {
    if (!user) return;
    authFetch(user, "/api/internal/briefing/templates")
      .then((r) => r.json())
      .then((p) => setTemplates((p.templates ?? []).filter((t: TemplateSummary) => t.status === "published")))
      .catch(() => setMessage("Não foi possível carregar os templates publicados."));
  }, [user]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user) return;
    setBusy(true); setMessage(""); setAccessUrl("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await authFetch(user, "/api/internal/briefing/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: data.get("templateId"),
          clientName: data.get("clientName"),
          projectName: data.get("projectName"),
          slug: data.get("slug"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error === "slug_in_use" ? "Esse slug já está em uso." : payload.error === "template_not_published" ? "Publique o template antes de criar a instância." : "Não foi possível criar o briefing.");
      setAccessUrl(payload.accessUrl);
      setMessage("Briefing criado com sucesso. Copie o link individual abaixo.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha ao criar briefing."); }
    finally { setBusy(false); }
  }

  if (!ready) return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Carregando…</main>;
  if (!user) return <main className="min-h-screen bg-[#040c17] grid place-items-center px-6 text-center text-white"><p>Faça login primeiro em <strong>/interno/briefings/modelos</strong>.</p></main>;

  return <main className="min-h-screen bg-[#040c17] text-white"><header className="border-b border-white/10 bg-[#06111f]/90 px-6 py-5"><div className="mx-auto max-w-4xl"><p className="text-xs font-semibold tracking-[0.25em] text-cyan-300">ALGENRI CLIENT FLOW</p><h1 className="mt-1 text-2xl font-semibold">Criar Briefing de Cliente</h1></div></header><div className="mx-auto max-w-4xl px-6 py-10"><form onSubmit={create} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8"><div className="grid gap-5 md:grid-cols-2"><label className="text-sm text-slate-300 md:col-span-2">Template publicado<select name="templateId" required className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-3"><option value="">Selecione</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name} — v{template.version}</option>)}</select></label><label className="text-sm text-slate-300">Cliente<input name="clientName" required defaultValue="OTIUM" className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-3" /></label><label className="text-sm text-slate-300">Projeto<input name="projectName" required defaultValue="Site OTIUM" className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-3" /></label><label className="text-sm text-slate-300 md:col-span-2">Slug do link<input name="slug" required defaultValue="otium" className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-3" /><span className="mt-1 block text-xs text-slate-500">Ex.: /briefing/otium</span></label></div><button disabled={busy || templates.length === 0} className="mt-6 flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"><Link2 size={18} />{busy ? "Criando…" : "Criar briefing"}</button>{templates.length === 0 && <p className="mt-3 text-sm text-amber-200">Nenhum template publicado encontrado. Volte aos Modelos de Briefing, altere o status para Publicado e salve.</p>}{message && <p className="mt-5 text-sm text-cyan-100">{message}</p>}{accessUrl && <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-4"><p className="break-all text-sm text-cyan-100">{accessUrl}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => navigator.clipboard.writeText(accessUrl)} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"><Copy size={15} /> Copiar link</button><a href={accessUrl} target="_blank" className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm"><ExternalLink size={15} /> Abrir briefing</a></div></div>}</form></div></main>;
}
