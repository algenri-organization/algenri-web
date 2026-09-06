"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { CheckCircle2, CircleAlert, RefreshCw, ShieldCheck } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Payload = {
  checks: Record<string, boolean>;
  summary: {
    whatsappRedirectReady: boolean;
    whatsappNotificationReady: boolean;
    commercialLeadReady: boolean;
  };
  note: string;
};

const labels: Record<string, string> = {
  publicWhatsAppNumber: "Número público do WhatsApp",
  metaAccessToken: "Token da API do WhatsApp",
  metaPhoneNumberId: "Phone Number ID da Meta",
  notifyWhatsAppNumber: "Número que recebe novos leads",
  contactEmailPublished: "E-mail comercial publicado",
  privacyPolicyPublished: "Política de Privacidade publicada",
};

async function authFetch(user: User) {
  const token = await user.getIdToken();
  return fetch("/api/internal/readiness", { headers: { Authorization: `Bearer ${token}` } });
}

export default function LaunchReadiness() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, current => { setUser(current); setReady(true); }), []);

  async function load(activeUser = user) {
    if (!activeUser) return;
    setBusy(true); setMessage("");
    try {
      const response = await authFetch(activeUser);
      const data = await response.json();
      if (!response.ok) throw new Error("Não foi possível executar o diagnóstico.");
      setPayload(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha no diagnóstico.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { if (user) load(user); }, [user]);

  if (!ready) return <div className="p-10 text-white">Carregando…</div>;
  if (!user) return <div className="p-10 text-white">Faça login em /interno.</div>;

  return (
    <main className="min-h-screen bg-[#040c17] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-cyan-300"><ShieldCheck className="h-4 w-4" /> Liberação comercial</div>
            <h1 className="mt-2 text-3xl font-semibold">Prontidão para vendas</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Confirme se os canais essenciais para receber e atender interessados estão configurados no ambiente de produção.</p>
          </div>
          <div className="flex gap-3"><a href="/interno" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60">Dashboard</a><button onClick={() => load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />Atualizar</button></div>
        </div>

        {message && <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/[.05] p-4 text-sm text-amber-100">{message}</div>}

        {payload && <>
          <section className={`mt-7 rounded-[28px] border p-6 ${payload.summary.commercialLeadReady ? "border-emerald-300/20 bg-emerald-300/[.05]" : "border-amber-300/20 bg-amber-300/[.05]"}`}>
            <div className="flex items-start gap-3">{payload.summary.commercialLeadReady ? <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-300" /> : <CircleAlert className="mt-0.5 h-6 w-6 text-amber-300" />}<div><h2 className="text-xl font-semibold">{payload.summary.commercialLeadReady ? "Configuração comercial essencial presente" : "Ainda há configuração comercial pendente"}</h2><p className="mt-2 text-sm leading-6 text-white/55">{payload.note}</p></div></div>
          </section>

          <div className="mt-6 grid gap-4 md:grid-cols-2">{Object.entries(payload.checks).map(([key, value]) => <div key={key} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-center justify-between gap-4"><p className="font-medium">{labels[key] ?? key}</p>{value ? <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[.06] px-3 py-1 text-xs text-emerald-200">Configurado</span> : <span className="rounded-full border border-amber-300/20 bg-amber-300/[.06] px-3 py-1 text-xs text-amber-100">Pendente</span>}</div></div>)}</div>

          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.025] p-5">
            <h2 className="font-semibold">Validação final do canal</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">Mesmo com todos os itens configurados, faça um envio real pelo formulário público de Contato. Confirme três resultados: o lead aparece em Interessados, o WhatsApp do cliente abre com a mensagem preparada e a notificação do novo lead chega ao número interno da ALGENRI.</p>
            <div className="mt-4 flex flex-wrap gap-3"><a href="/contato" target="_blank" className="rounded-xl bg-violet-300 px-4 py-2.5 text-sm font-semibold text-slate-950">Abrir formulário de teste</a><a href="/interno/leads" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/65">Ver interessados</a></div>
          </section>
        </>}
      </div>
    </main>
  );
}
