"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { History, ShieldCheck } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type AuditEntry = {
  id: string;
  actorEmail: string;
  action: "user_provisioned" | "user_updated";
  targetEmail: string | null;
  changes: Record<string, unknown>;
  createdAt: string | null;
};

async function authFetch(user: User, input: RequestInfo | URL) {
  const token = await user.getIdToken();
  return fetch(input, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
}

function formatDate(value: string | null) {
  if (!value) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function describeChanges(changes: Record<string, unknown>) {
  const items: string[] = [];
  if (typeof changes.role === "string") items.push(`perfil: ${changes.role === "admin" ? "administrador" : "colaborador"}`);
  if (typeof changes.active === "boolean") items.push(changes.active ? "acesso ativado" : "acesso desativado");
  if (Array.isArray(changes.permissions)) items.push(`permissões: ${changes.permissions.length ? changes.permissions.join(", ") : "nenhuma"}`);
  return items.length ? items.join(" · ") : "Alteração administrativa registrada";
}

export default function AccessAuditPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(firebaseAuth, async (user) => {
    if (!user) { setLoading(false); return; }
    try {
      const response = await authFetch(user, "/api/internal/users/audit");
      const payload = await response.json();
      if (response.status === 403) { setAllowed(false); setEntries([]); return; }
      if (!response.ok) throw new Error("Não foi possível carregar a trilha de auditoria.");
      setAllowed(true);
      setEntries(payload.entries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar a trilha de auditoria.");
    } finally {
      setLoading(false);
    }
  }), []);

  if (!allowed && !loading) return null;

  return <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.025] p-6">
    <div className="flex items-center gap-2"><History className="h-5 w-5 text-cyan-300"/><div><h2 className="font-semibold">Auditoria de acessos</h2><p className="mt-1 text-sm text-white/40">Últimas alterações administrativas de usuários e permissões.</p></div></div>
    {error && <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-100">{error}</p>}
    <div className="mt-5 space-y-3">
      {loading ? <p className="text-sm text-white/40">Carregando auditoria…</p> : entries.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-5 text-sm text-white/35">Nenhuma alteração de acesso registrada até o momento.</div> : entries.map(entry => <div key={entry.id} className="rounded-2xl border border-white/[.08] bg-black/10 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300"/><p className="text-sm font-medium text-white/85">{entry.action === "user_provisioned" ? "Usuário provisionado" : "Acesso atualizado"}</p></div><p className="mt-2 text-xs text-white/45">Alvo: {entry.targetEmail || "usuário interno"}</p><p className="mt-1 text-xs leading-5 text-white/35">{describeChanges(entry.changes ?? {})}</p><p className="mt-2 text-[11px] text-white/25">Executado por {entry.actorEmail}</p></div><span className="text-[11px] text-white/30">{formatDate(entry.createdAt)}</span></div></div>)}
    </div>
  </section>;
}
