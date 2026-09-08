"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { CircleDollarSign, HandCoins } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Charge = {
  id: string;
  clientName: string;
  description: string;
  amountCents: number;
  receivedAmountCents?: number;
  balanceCents?: number;
  dueDate: string;
  status: "pending" | "paid" | "cancelled";
};

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(input, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` }, cache: "no-store" });
}

const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

export default function PartialPaymentPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [chargeId, setChargeId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, (next) => setUser(next)), []);
  useEffect(() => { if (user) load(user); }, [user]);

  async function load(active: User) {
    const response = await authFetch(active, "/api/internal/finance/charges");
    const payload = await response.json();
    if (!response.ok) { setMessage("Não foi possível carregar as cobranças para recebimento parcial."); return; }
    setCharges(payload.charges ?? []);
  }

  const openCharges = useMemo(() => charges.filter((charge) => charge.status === "pending" && (charge.balanceCents ?? charge.amountCents) > 0), [charges]);
  const selected = openCharges.find((charge) => charge.id === chargeId);

  async function save() {
    if (!user || !chargeId) return;
    setSaving(true); setMessage("");
    try {
      const response = await authFetch(user, `/api/internal/finance/charges/${chargeId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, paymentMethod, notes }),
      });
      const payload = await response.json();
      if (!response.ok) {
        const errors: Record<string, string> = {
          payment_amount_required: "Informe um valor recebido válido.",
          payment_exceeds_balance: "O valor informado é maior que o saldo da cobrança.",
          charge_already_paid: "Esta cobrança já foi quitada.",
          charge_cancelled: "Uma cobrança cancelada não pode receber pagamentos.",
        };
        setMessage(errors[payload.error] ?? "Não foi possível registrar o recebimento.");
        return;
      }
      const remaining = payload.charge?.balanceCents ?? 0;
      setMessage(remaining > 0 ? `Recebimento registrado. Saldo restante: ${money(remaining)}.` : "Recebimento registrado e cobrança quitada.");
      setAmount(""); setNotes(""); setChargeId("");
      await load(user);
    } finally { setSaving(false); }
  }

  if (!user) return null;

  return <section className="mx-auto mt-6 max-w-7xl rounded-3xl border border-white/10 bg-white/[.025] p-5 text-white">
    <div className="flex items-start gap-3">
      <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/[.06] p-2"><HandCoins className="h-5 w-5 text-cyan-200" /></div>
      <div><h2 className="font-semibold">Recebimentos parciais</h2><p className="mt-1 text-sm text-white/40">Registre entradas parciais sem encerrar a cobrança antes da quitação total.</p></div>
    </div>

    <div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_.7fr_.7fr_1.2fr_auto]">
      <select value={chargeId} onChange={(e) => setChargeId(e.target.value)} className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none">
        <option value="">Selecione uma cobrança em aberto</option>
        {openCharges.map((charge) => <option key={charge.id} value={charge.id}>{charge.clientName} · {charge.description} · saldo {money(charge.balanceCents ?? charge.amountCents)}</option>)}
      </select>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Valor recebido" className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none" />
      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none"><option>Pix</option><option>Transferência</option><option>Boleto</option><option>Cartão</option><option>Outro</option></select>
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observação (opcional)" className="rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm outline-none" />
      <button disabled={!chargeId || !amount || saving} onClick={save} className="flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"><CircleDollarSign className="h-4 w-4" />{saving ? "Salvando…" : "Registrar"}</button>
    </div>

    {selected && <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-[11px] text-white/35">Valor original</p><p className="mt-1 font-medium">{money(selected.amountCents)}</p></div><div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-[11px] text-white/35">Já recebido</p><p className="mt-1 font-medium text-emerald-100">{money(selected.receivedAmountCents ?? 0)}</p></div><div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-[11px] text-white/35">Saldo</p><p className="mt-1 font-medium text-amber-100">{money(selected.balanceCents ?? selected.amountCents)}</p></div></div>}
    {message && <p className="mt-4 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/65">{message}</p>}
  </section>;
}
