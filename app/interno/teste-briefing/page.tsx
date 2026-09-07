"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ExternalLink, FilePlus2 } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(input, {
    ...init,
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
  });
}

export default function TesteBriefingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [accessUrl, setAccessUrl] = useState("");
  const [projectId, setProjectId] = useState("");

  useEffect(() => onAuthStateChanged(firebaseAuth, (nextUser) => {
    setUser(nextUser);
    setReady(true);
  }), []);

  async function createTestBriefing() {
    if (!user || busy) return;
    setBusy(true);
    setMessage("");
    setAccessUrl("");
    try {
      const response = await authFetch(user, "/api/internal/briefing/teste-ltda", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        const labels: Record<string, string> = {
          teste_ltda_not_found: "A empresa Teste Ltda não foi encontrada.",
          teste_ltda_project_not_found: "A Teste Ltda ainda não possui projeto cadastrado.",
          slug_in_use: "Já existe um briefing de teste usando este endereço.",
        };
        throw new Error(labels[payload.error] || "Não foi possível criar o briefing de teste.");
      }
      setProjectId(payload.projectId || "");
      if (payload.alreadyExists) {
        setMessage("O briefing de teste já existe e está vinculado ao projeto mais recente da Teste Ltda.");
      } else {
        setAccessUrl(payload.accessUrl || "");
        setMessage("Briefing de teste criado, publicado e vinculado à Teste Ltda.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao criar briefing de teste.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Carregando…</main>;
  if (!user) return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Faça login em /interno.</main>;

  return (
    <main className="min-h-screen bg-[#040c17] px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.24em] text-cyan-300">TESTE COMERCIAL</p>
        <h1 className="mt-2 text-3xl font-semibold">Briefing fictício — Teste Ltda</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
          Esta ação cria um modelo publicado com 12 perguntas fictícias e gera uma instância vinculada ao projeto mais recente da empresa Teste Ltda. Ela existe apenas para destravar a validação ponta a ponta do lançamento.
        </p>

        <section className="mt-8 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-6">
          <button
            disabled={busy}
            onClick={createTestBriefing}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            <FilePlus2 size={17} />
            {busy ? "Criando…" : "Criar briefing de teste"}
          </button>

          {message && <p className="mt-4 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/75">{message}</p>}

          {(accessUrl || projectId) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {accessUrl && (
                <a href={accessUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/25 px-4 py-2.5 text-sm text-emerald-100">
                  Responder briefing <ExternalLink size={14} />
                </a>
              )}
              {projectId && (
                <a href={`/interno/projetos/${encodeURIComponent(projectId)}`} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 px-4 py-2.5 text-sm text-cyan-100">
                  Abrir projeto <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
