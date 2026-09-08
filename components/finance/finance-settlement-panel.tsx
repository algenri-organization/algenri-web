"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { BadgeDollarSign, CheckCircle2, RefreshCw } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Charge = {
  id: string;
  clientName: string;
  description: string;
  amountCents: number;
  status: "pending" | "paid" | "cancelled";
  paymentMethod: string;
  paidAt: string | null;
  providerFeeCents?: number;
  netAmountCents?: number;
  settledAt?: string | null;
  settlementNotes?: string;
};

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(input, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` }, cache: "no-store" });
}

const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
const parseAmount = (value: string) => {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
};

export default function FinanceSettlementPanel() {
  const [user, setUser] = useState<User | null>(firebaseAuth.currentUser);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [fee, setFee] = useState("0,00");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(firebaseAuth, setUser), []);
  useEffect(() => { if (user) load(user); }, [user]);

  async function load(active: User) {
    setLoading(true); setError("");
    try {
      const response = await authFetch(active, "/api/internal/finance/charges");
      const payload = await response.json();
      if (!response.ok) throw new Error("Não foi possível carregar as cobranças recebidas.");
      const paid = (payload.charges ?? []).filter((charge: Charge) => charge.status === "paid");
      setCharges(paid);
      if (!selectedId && paid.length) setSelectedId(paid[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as cobranças recebidas.");
    } finally { setLoading(false); }
  }

  const selected = useMemo(() => charges.find(charge => charge.id === selectedId) ?? null, [charges, selectedId]);
  const feeCents = parseAmount(fee);
  const previewNet = selected ? Math.max(0, selected.amountCents - feeCents) : 0;

  useEffect(() => {
    if (!selected) return;
    setFee(((selected.providerFeeCents ?? 0) / 100).toFixed(2).replace(".", ","));
    setNotes(selected.settlementNotes ?? "");
  }, [selectedId]);

  async function save() {
    if (!user || !selected) return;
    setSaving(true); setMessage(""); setError("");
    try {
      const response = await authFetch(user, `/api/internal/finance/charges/${selected.id}/settlement`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerFee: fee, notes }),
      });
      const payload = await response.json();
      if (!response.ok) {
        if (payload.error === "provider_fee_invalid") throw new Error("A taxa não pode ser negativa nem maior que o valor recebido.");
        if (payload.error === "charge_not_paid") throw new Error("Somente cobranças marcadas como recebidas podem ser conciliadas.");
        throw new Error("Não foi possível salvar a conciliação.");
      }
      setMessage("Conciliação salva com sucesso.");
      await load(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a conciliação.");
    } finally { setSaving(false); }
  }

  if (!user) return null;

  return <section className="mx-auto max-w-7xl px-6 pb-10">
    <div className="rounded-3xl border border-white/10 bg-white/[.025] p-5 text-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3"><BadgeDollarSign className="mt-0.5 h-5 w-5 text-cyan-300"/><div><h2 className="font-semibold">Conciliação de recebimentos</h2><p className="mt-1 text-sm text-white/40">Registre manualmente taxas e valor líquido enquanto a integração bancária automática não estiver disponível.</p></div></div>
        <button onClick={() => user && load(user)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60"><RefreshCw className="h-3.5 w-3.5"/>Atualizar</button>
      </div>

      {loading ? <p className="mt-5 text-sm text-white/40">Carregando recebimentos…</p> : charges.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/10 p-5 text-sm text-white/35">Nenhuma cobrança recebida disponível para conciliação.</div> : <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-2">{charges.slice(0, 20).map(charge => <button key={charge.id} onClick={() => setSelectedId(charge.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === charge.id ? "border-cyan-300/25 bg-cyan-300/[.06]" : "border-white/10 bg-black/10"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{charge.clientName}</p><p className="mt-1 text-xs text-white/45">{charge.description}</p><p className="mt-2 text-[11px] text-white/30">{charge.paymentMethod || "Meio não informado"}</p></div><div className="text-right"><p className="text-sm font-semibold">{money(charge.amountCents)}</p>{charge.settledAt ? <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-300/10 px-2 py-1 text-[10px] text-emerald-100"><CheckCircle2 className="h-3 w-3"/>Conciliado</span> : <span className="mt-2 inline-flex rounded-full bg-amber-300/10 px-2 py-1 text-[10px] text-amber-100">Pendente</span>}</div></div></button>)}</div>
        {selected && <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs font-semibold tracking-[.15em] text-cyan-300">DETALHES DA CONCILIAÇÃO</p><div className="mt-4 space-y-3"><div><p className="text-xs text-white/35">Valor bruto recebido</p><p className="mt-1 text-lg font-semibold">{money(selected.amountCents)}</p></div><label className="block"><span className="text-xs text-white/40">Taxas/descontos</span><input value={fee} onChange={event => setFee(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none focus:border-cyan-300/40" placeholder="0,00"/></label><div><p className="text-xs text-white/35">Valor líquido previsto</p><p className="mt-1 text-xl font-semibold text-emerald-200">{money(previewNet)}</p></div><label className="block"><span className="text-xs text-white/40">Observações da conciliação</span><textarea value={notes} onChange={event => setNotes(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none focus:border-cyan-300/40" placeholder="Ex.: taxa de boleto, antecipação ou ajuste manual"/></label><button onClick={save} disabled={saving || feeCents < 0 || feeCents > selected.amountCents} className="w-full rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-40">{saving ? "Salvando…" : selected.settledAt ? "Atualizar conciliação" : "Concluir conciliação"}</button></div></div>}
      </div>}
      {(message || error) && <p className={`mt-4 rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-400/20 bg-rose-400/5 text-rose-100" : "border-emerald-400/20 bg-emerald-400/5 text-emerald-100"}`}>{error || message}</p>}
    </div>
  </section>;
}
