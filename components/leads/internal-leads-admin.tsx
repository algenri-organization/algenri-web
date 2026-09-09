"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { RefreshCw } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Lead = {
  id: string;
  name: string;
  company: string;
  whatsapp: string;
  email: string | null;
  interest: string;
  message: string | null;
  source: string;
  status: string;
  createdAt: string;
  notificationStatus: string;
  notificationError: string | null;
  notificationMessageId?: string | null;
  notificationDeliveryStatus?: string | null;
  notificationDeliveryAt?: string | null;
  notificationDeliveryError?: string | null;
  notificationRetryCount?: number;
  notificationLastRetryAt?: string | null;
};

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(input, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function notificationLabel(status: string) {
  if (status === "sent") return "aceita pela Meta";
  if (status === "failed") return "falhou no envio";
  if (status === "skipped") return "não configurada";
  return status;
}

function deliveryLabel(status?: string | null) {
  if (status === "accepted") return "aguardando confirmação";
  if (status === "sent") return "enviada pela Meta";
  if (status === "delivered") return "entregue";
  if (status === "read") return "lida";
  if (status === "failed") return "falhou na entrega";
  return "sem retorno de webhook";
}

export default function InternalLeadsAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [message, setMessage] = useState("");
  const [clearing, setClearing] = useState(false);
  const [retrying, setRetrying] = useState("");

  useEffect(() => onAuthStateChanged(firebaseAuth, (next) => { setUser(next); setReady(true); }), []);

  async function load(active = user) {
    if (!active) return;
    const response = await authFetch(active, "/api/internal/leads");
    const payload = await response.json();
    if (!response.ok) throw new Error("Não foi possível carregar os interessados.");
    setLeads(payload.leads ?? []);
  }

  useEffect(() => {
    if (!user) return;
    load(user).catch((error) => setMessage(error instanceof Error ? error.message : "Falha ao carregar interessados."));
  }, [user]);

  async function clearTestLeads() {
    if (!user || leads.length === 0 || clearing) return;
    const confirmed = window.confirm(`Excluir definitivamente os ${leads.length} lead(s) atuais? Use apenas para limpar a base de testes.`);
    if (!confirmed) return;

    setClearing(true);
    setMessage("");
    try {
      const response = await authFetch(user, "/api/internal/leads", {
        method: "DELETE",
        headers: { "x-algenri-confirm": "DELETE_ALL_TEST_LEADS" },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error("Não foi possível zerar os leads de teste.");
      setLeads([]);
      setMessage(`${payload.deleted ?? 0} lead(s) de teste excluído(s). A mensuração comercial foi zerada.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao zerar leads de teste.");
    } finally {
      setClearing(false);
    }
  }

  async function retryNotification(lead: Lead) {
    if (!user || retrying) return;
    setRetrying(lead.id);
    setMessage("");
    try {
      const response = await authFetch(user, `/api/internal/leads/${lead.id}/retry-notification`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error === "retry_not_allowed" ? "Este alerta não está elegível para reenvio." : "Não foi possível reenviar o alerta pelo WhatsApp.");
      await load(user);
      setMessage(payload.notificationStatus === "sent" ? `Alerta de ${lead.name} reenviado e aceito pela Meta.` : `Nova tentativa registrada com status ${payload.notificationStatus}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao reenviar alerta.");
    } finally {
      setRetrying("");
    }
  }

  if (!ready) return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Carregando…</main>;
  if (!user) return <main className="min-h-screen bg-[#040c17] grid place-items-center px-6 text-center text-white"><p>Faça login primeiro em <strong>/interno/briefings/modelos</strong>.</p></main>;

  return (
    <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[.25em] text-cyan-300">ALGENRI CRM</p><h1 className="mt-2 text-3xl font-semibold">Interessados</h1><p className="mt-2 text-sm text-white/50">Contatos registrados pelo site antes da abertura do WhatsApp.</p></div>
          <div className="flex flex-wrap items-center gap-3">
            {leads.length > 0 && <button type="button" onClick={clearTestLeads} disabled={clearing} className="rounded-xl border border-rose-300/20 bg-rose-300/[.05] px-4 py-2.5 text-sm text-rose-100 transition hover:bg-rose-300/[.1] disabled:cursor-not-allowed disabled:opacity-50">{clearing ? "Zerando…" : "Zerar leads de teste"}</button>}
            <a href="/interno" className="text-sm text-white/50 hover:text-white">Voltar ao dashboard</a>
          </div>
        </div>

        {message && <p className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/[.05] px-4 py-3 text-sm text-amber-100">{message}</p>}

        <div className="mt-7 grid gap-4">
          {leads.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/[.025] p-6 text-sm text-white/45">Nenhum interessado registrado ainda.</div>}
          {leads.map((lead) => {
            const canRetry = lead.notificationStatus === "failed" || lead.notificationDeliveryStatus === "failed";
            return <article key={lead.id} className="rounded-[22px] border border-white/10 bg-white/[.03] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{lead.name}</h2><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/45">{lead.company}</span></div>
                  <p className="mt-2 text-sm text-cyan-200">{lead.interest}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/50"><span>{lead.whatsapp}</span>{lead.email && <span>{lead.email}</span>}<span>{formatDate(lead.createdAt)}</span></div>
                  {lead.message && <p className="mt-4 max-w-3xl text-sm leading-6 text-white/55">{lead.message}</p>}
                </div>
                <div className="max-w-md text-xs text-white/40">
                  <div>Envio WhatsApp: <span className={lead.notificationStatus === "sent" ? "text-cyan-200" : lead.notificationStatus === "failed" ? "text-rose-200" : "text-amber-200"}>{notificationLabel(lead.notificationStatus)}</span></div>
                  <div className="mt-1">Entrega: <span className={lead.notificationDeliveryStatus === "read" || lead.notificationDeliveryStatus === "delivered" ? "text-emerald-200" : lead.notificationDeliveryStatus === "failed" ? "text-rose-200" : "text-amber-200"}>{deliveryLabel(lead.notificationDeliveryStatus)}</span></div>
                  {lead.notificationDeliveryAt && <div className="mt-1 text-[10px] text-white/30">Última atualização: {formatDate(lead.notificationDeliveryAt)}</div>}
                  {lead.notificationRetryCount ? <div className="mt-1 text-[10px] text-violet-200/70">Reenvios: {lead.notificationRetryCount}{lead.notificationLastRetryAt ? ` · último em ${formatDate(lead.notificationLastRetryAt)}` : ""}</div> : null}
                  {lead.notificationDeliveryError && <div className="mt-2 break-words rounded-lg border border-rose-300/10 bg-rose-300/[.04] p-2 text-[10px] leading-4 text-rose-100/70">{lead.notificationDeliveryError}</div>}
                  {lead.notificationError && <div className="mt-2 break-words rounded-lg border border-white/[.07] bg-black/20 p-2 text-[10px] leading-4 text-white/35">{lead.notificationError}</div>}
                  {canRetry && <button type="button" disabled={retrying === lead.id} onClick={() => retryNotification(lead)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-violet-300/25 bg-violet-300/[.05] px-3 py-2 text-[11px] font-medium text-violet-100 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${retrying === lead.id ? "animate-spin" : ""}`}/>{retrying === lead.id ? "Reenviando…" : "Reenviar alerta"}</button>}
                  {lead.notificationMessageId && <div className="mt-2 break-all text-[9px] text-white/20">ID Meta: {lead.notificationMessageId}</div>}
                </div>
              </div>
            </article>;
          })}
        </div>
      </div>
    </main>
  );
}
