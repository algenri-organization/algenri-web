"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { PauseCircle, PlayCircle, Repeat2 } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Series = {
  seriesId: string;
  clientName: string;
  description: string;
  recurrenceFrequency: string;
  totalOccurrences: number;
  paidOccurrences: number;
  pendingOccurrences: number;
  pausedOccurrences: number;
  nextDueDate: string | null;
  paused: boolean;
};

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(input, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` }, cache: "no-store" });
}

const frequencyLabel: Record<string, string> = { monthly: "Mensal", quarterly: "Trimestral", semiannual: "Semestral", annual: "Anual" };

export default function RecurringSeriesPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [series, setSeries] = useState<Series[]>([]);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => onAuthStateChanged(firebaseAuth, setUser), []);
  useEffect(() => { if (user) load(user); }, [user]);

  async function load(active: User) {
    const response = await authFetch(active, "/api/internal/finance/recurring");
    const payload = await response.json();
    if (!response.ok) { setMessage("Não foi possível carregar as recorrências."); return; }
    setSeries(payload.series ?? []);
  }

  async function toggle(item: Series) {
    if (!user) return;
    setBusy(item.seriesId); setMessage("");
    try {
      const response = await authFetch(user, "/api/internal/finance/recurring", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesId: item.seriesId, paused: !item.paused }),
      });
      const payload = await response.json();
      if (!response.ok) { setMessage(payload.error === "no_future_occurrences" ? "Esta recorrência não possui ocorrências futuras disponíveis para alteração." : "Não foi possível atualizar a recorrência."); return; }
      setMessage(item.paused ? "Recorrência retomada." : "Recorrência pausada. As ocorrências futuras deixaram de compor a previsão financeira.");
      await load(user);
    } finally { setBusy(""); }
  }

  if (!user || !series.length) return null;

  return <section className="mx-auto mt-6 max-w-7xl rounded-3xl border border-white/10 bg-white/[.025] p-5 text-white">
    <div className="flex items-start gap-3"><div className="rounded-xl border border-violet-300/15 bg-violet-300/[.06] p-2"><Repeat2 className="h-5 w-5 text-violet-200" /></div><div><h2 className="font-semibold">Recorrências</h2><p className="mt-1 text-sm text-white/40">Pause ou retome cobranças recorrentes futuras sem alterar valores já recebidos.</p></div></div>
    <div className="mt-5 space-y-3">{series.map((item) => <div key={item.seriesId} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{item.clientName}</p><span className={`rounded-full px-2 py-1 text-[10px] ${item.paused ? "bg-amber-300/10 text-amber-100" : "bg-emerald-300/10 text-emerald-100"}`}>{item.paused ? "Pausada" : "Ativa"}</span></div><p className="mt-1 text-sm text-white/55">{item.description} · {frequencyLabel[item.recurrenceFrequency] ?? item.recurrenceFrequency}</p><p className="mt-2 text-xs text-white/35">{item.paidOccurrences} pagas · {item.pendingOccurrences} futuras ativas · {item.pausedOccurrences} pausadas · {item.totalOccurrences} ocorrências no total{item.nextDueDate ? ` · próxima ${new Date(`${item.nextDueDate}T12:00:00`).toLocaleDateString("pt-BR")}` : ""}</p></div><button disabled={busy === item.seriesId || (item.pendingOccurrences + item.pausedOccurrences) === 0} onClick={() => toggle(item)} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm disabled:opacity-40">{item.paused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}{busy === item.seriesId ? "Salvando…" : item.paused ? "Retomar" : "Pausar"}</button></div>)}</div>
    {message && <p className="mt-4 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/65">{message}</p>}
  </section>;
}
