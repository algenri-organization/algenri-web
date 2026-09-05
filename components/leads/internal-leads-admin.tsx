"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
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
};

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(input, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function InternalLeadsAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => onAuthStateChanged(firebaseAuth, (next) => { setUser(next); setReady(true); }), []);
  useEffect(() => {
    if (!user) return;
    authFetch(user, "/api/internal/leads")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error("Não foi possível carregar os interessados.");
        setLeads(payload.leads ?? []);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Falha ao carregar interessados."));
  }, [user]);

  if (!ready) return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Carregando…</main>;
  if (!user) return <main className="min-h-screen bg-[#040c17] grid place-items-center px-6 text-center text-white"><p>Faça login primeiro em <strong>/interno/briefings/modelos</strong>.</p></main>;

  return (
    <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[.25em] text-cyan-300">ALGENRI CRM</p><h1 className="mt-2 text-3xl font-semibold">Interessados</h1><p className="mt-2 text-sm text-white/50">Contatos registrados pelo site antes da abertura do WhatsApp.</p></div>
          <a href="/interno" className="text-sm text-white/50 hover:text-white">Voltar ao dashboard</a>
        </div>

        {message && <p className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/[.05] px-4 py-3 text-sm text-amber-100">{message}</p>}

        <div className="mt-7 grid gap-4">
          {leads.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/[.025] p-6 text-sm text-white/45">Nenhum interessado registrado ainda.</div>}
          {leads.map((lead) => (
            <article key={lead.id} className="rounded-[22px] border border-white/10 bg-white/[.03] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{lead.name}</h2><span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/45">{lead.company}</span></div>
                  <p className="mt-2 text-sm text-cyan-200">{lead.interest}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/50"><span>{lead.whatsapp}</span>{lead.email && <span>{lead.email}</span>}<span>{formatDate(lead.createdAt)}</span></div>
                  {lead.message && <p className="mt-4 max-w-3xl text-sm leading-6 text-white/55">{lead.message}</p>}
                </div>
                <div className="text-xs text-white/35">Notificação WhatsApp: <span className={lead.notificationStatus === "sent" ? "text-emerald-200" : lead.notificationStatus === "failed" ? "text-rose-200" : "text-amber-200"}>{lead.notificationStatus}</span></div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
