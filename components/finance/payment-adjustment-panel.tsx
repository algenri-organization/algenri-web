"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { History, RotateCcw } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Charge = {
  id: string;
  clientName: string;
  description: string;
  amountCents: number;
  receivedAmountCents?: number;
  balanceCents?: number;
  status: "pending" | "paid" | "cancelled";
};

type PaymentEvent = {
  id: string;
  type?: "payment" | "reversal";
  amountCents: number;
  paymentMethod?: string;
  notes: string;
  createdBy: string;
  createdAt: string;
};

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(input, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` }, cache: "no-store" });
}

const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
const dateTime = (value: string) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";

export default function PaymentAdjustmentPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [chargeId, setChargeId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, setUser), []);
  useEffect(() => { if (user) loadCharges(user); }, [user]);

  async function loadCharges(active: User) {
    const response = await authFetch(active, "/api/internal/finance/charges");
    const payload = await response.json();
    if (!response.ok) { setMessage("Não foi possível carregar as cobranças para ajuste."); return; }
    setCharges(payload.charges ?? []);
  }

  async function loadHistory(active: User, id: string) {
    if (!id) { setEvents([]); return; }
    const response = await authFetch(active, `/api/internal/finance/charges/${id}/payments`);
    const payload = await response.json();
    setEvents(response.ok ? (payload.events ?? []) : []);
  }

  const reversible = useMemo(() => charges.filter((charge) => charge.status !== "cancelled" && (charge.receivedAmountCents ?? 0) > 0), [charges]);
  const selected = reversible.find((charge) => charge.id === chargeId);

  async function selectCharge(id: string) {
    setChargeId(id); setMessage(""); setAmount(""); setReason("");
    if (user) await loadHistory(user, id);
  }

  async function reverse() {
    if (!user || !chargeId) return;
    setSaving(true); setMessage("");
    try {
      const response = await authFetch(user, `/api/internal/finance/charges/${chargeId}/payments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, notes: reason }),
      });
      const payload = await response.json();
      if (!response.ok) {
        const errors: Record<string, string> = {
          reversal_amount_required: "Informe um valor de estorno válido.",
          reversal_reason_required: "Informe o motivo do ajuste.",
          reversal_exceeds_received: "O estorno não pode superar o total já recebido.",
          nothing_to_reverse: "Esta cobrança não possui valor recebido para estornar.",
          charge_cancelled: "Cobranças canceladas não podem ser ajustadas.",
        };
        setMessage(errors[payload.error] ?? "Não foi possível registrar o estorno.");
        return;
      }
      setMessage(`Ajuste registrado. Novo saldo da cobrança: ${money(payload.charge?.balanceCents ?? 0)}.`);
      setAmount(""); setReason("");
      await Promise.all([loadCharges(user), loadHistory(user, chargeId)]);
    } finally { setSaving(false); }
  }

  if (!user) return null;

  return <section className="mx-auto mt-6 max-w-7xl rounded-3xl border border-white/10 bg-white/[.025] p-5 text-white">
    <div className="flex items-start gap-3">
      <div className="rounded-xl border border-amber-300/15 bg-amber-300/[.06] p-2"><RotateCcw className="h-5 w-5 text-amber-200" /></div>
      <div><h2 className="font-semibold">Estornos e ajustes</h2><p className="mt-1 text-sm text-white/40">Corrija recebimentos lançados por engano sem apagar o histórico financeiro.</p></div>
    </div>

    <div className="mt-5 grid gap-3 lg:grid-cols-[1.5fr_.7fr_1.3fr_auto]">
      <select value={chargeId} onChange={(e) => selectCharge(e.target.value)} className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none">
        <option value="">Selecione uma cobrança com recebimento</option>
        {reversible.map((charge) => <option key={charge.id} value={charge.id}>{charge.clientName} · {charge.description} · recebido {money(charge.receivedAmountCents ?? 0)}</option>)}
      </select>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Valor a estornar" className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none" />
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo obrigatório" className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none" />
      <button disabled={!chargeId || !amount || !reason.trim() || saving} onClick={reverse} className="flex items-center justify-center gap-2 rounded-xl border border-amber-200/20 bg-amber-200/10 px-4 py-2.5 text-sm font-semibold text-amber-100 disabled:cursor-not-allowed disabled:opacity-40"><RotateCcw className="h-4 w-4" />{saving ? "Ajustando…" : "Registrar ajuste"}</button>
    </div>

    {selected && <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-[11px] text-white/35">Valor original</p><p className="mt-1 font-medium">{money(selected.amountCents)}</p></div><div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-[11px] text-white/35">Recebido atualmente</p><p className="mt-1 font-medium text-emerald-100">{money(selected.receivedAmountCents ?? 0)}</p></div><div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-[11px] text-white/35">Saldo em aberto</p><p className="mt-1 font-medium text-amber-100">{money(selected.balanceCents ?? selected.amountCents)}</p></div></div>}

    {chargeId && <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-center gap-2"><History className="h-4 w-4 text-white/50"/><h3 className="text-sm font-semibold">Histórico de recebimentos e ajustes</h3></div><div className="mt-3 space-y-2">{events.length === 0 ? <p className="text-sm text-white/35">Nenhum evento registrado para esta cobrança.</p> : events.slice(0, 10).map((event) => <div key={event.id} className="flex flex-col gap-1 rounded-xl border border-white/10 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"><div><p className={event.type === "reversal" ? "text-amber-100" : "text-emerald-100"}>{event.type === "reversal" ? "Estorno/Ajuste" : "Recebimento"} · {money(event.amountCents)}</p><p className="text-xs text-white/35">{event.notes || event.paymentMethod || "Sem observação"}</p></div><p className="text-xs text-white/30">{dateTime(event.createdAt)} · {event.createdBy}</p></div>)}</div></div>}

    {message && <p className="mt-4 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/65">{message}</p>}
  </section>;
}
