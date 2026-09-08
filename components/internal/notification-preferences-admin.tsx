"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Bell, Mail, Save, Smartphone, TriangleAlert } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Preferences = {
  financeOverdueInApp: boolean;
  commercialUpdatesInApp: boolean;
  operationUpdatesInApp: boolean;
  emailDigest: boolean;
  emailFinanceOverdue: boolean;
  whatsappCriticalAlerts: boolean;
};

const defaults: Preferences = {
  financeOverdueInApp: true,
  commercialUpdatesInApp: true,
  operationUpdatesInApp: true,
  emailDigest: false,
  emailFinanceOverdue: false,
  whatsappCriticalAlerts: false,
};

async function authFetch(user: User, input: RequestInfo | URL, init?: RequestInit) {
  const token = await user.getIdToken();
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={`relative h-7 w-12 rounded-full border transition ${disabled ? "cursor-not-allowed border-white/10 bg-white/[.03] opacity-50" : checked ? "border-cyan-300/30 bg-cyan-300/20" : "border-white/10 bg-white/[.05]"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-6" : "left-1"}`} /></button>;
}

export default function NotificationPreferencesAdmin() {
  const [user, setUser] = useState<User | null>(firebaseAuth.currentUser);
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(firebaseAuth, setUser), []);
  useEffect(() => { if (user) load(user); }, [user]);

  async function load(active: User) {
    setLoading(true); setError("");
    try {
      const response = await authFetch(active, "/api/internal/settings/notifications");
      const payload = await response.json();
      if (!response.ok) throw new Error("Não foi possível carregar suas preferências.");
      setPrefs({ ...defaults, ...(payload.preferences ?? {}) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar suas preferências.");
    } finally { setLoading(false); }
  }

  async function save() {
    if (!user) return;
    setSaving(true); setMessage(""); setError("");
    try {
      const response = await authFetch(user, "/api/internal/settings/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(prefs) });
      const payload = await response.json();
      if (!response.ok) throw new Error("Não foi possível salvar suas preferências.");
      setPrefs({ ...defaults, ...(payload.preferences ?? prefs) });
      setMessage("Preferências de notificação salvas com sucesso.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar suas preferências.");
    } finally { setSaving(false); }
  }

  const set = (key: keyof Preferences, value: boolean) => setPrefs((current) => ({ ...current, [key]: value }));
  if (!user) return null;

  return <main className="min-h-screen bg-[#040c17] px-5 pb-20 pt-28 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl">
    <div className="border-b border-white/10 pb-8"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.25em] text-cyan-300"><Bell className="h-4 w-4" /> Notificações</div><h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Preferências de alertas</h1><p className="mt-3 max-w-3xl leading-7 text-white/55">Defina quais avisos deseja priorizar na Área Interna e deixe seus canais pessoais preparados para as próximas automações.</p></div>

    <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[.04] p-4"><TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-200"/><p className="text-sm leading-6 text-white/48">A notificação automática de novos leads pelo WhatsApp já está operacional. As preferências abaixo são pessoais e ainda não alteram esse fluxo. E-mail, alertas críticos por WhatsApp e filtros do dashboard serão conectados em etapas posteriores.</p></div>

    {loading ? <p className="mt-6 text-sm text-white/40">Carregando preferências…</p> : <div className="mt-6 space-y-5">
      <section className="rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6"><div className="flex items-center gap-3"><Bell className="h-5 w-5 text-cyan-300"/><div><h2 className="font-semibold">Área Interna</h2><p className="mt-1 text-sm text-white/40">Escolha quais grupos de alertas devem permanecer priorizados para seu usuário.</p></div></div><div className="mt-5 divide-y divide-white/[.07]">
        <div className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-medium">Cobranças vencidas</p><p className="mt-1 text-xs text-white/38">Inadimplência e itens financeiros em atraso.</p></div><Toggle checked={prefs.financeOverdueInApp} onChange={(v)=>set("financeOverdueInApp",v)} /></div>
        <div className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-medium">Movimentações comerciais</p><p className="mt-1 text-xs text-white/38">Novos interessados, propostas, contratos e mudanças do pipeline.</p></div><Toggle checked={prefs.commercialUpdatesInApp} onChange={(v)=>set("commercialUpdatesInApp",v)} /></div>
        <div className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-medium">Atualizações operacionais</p><p className="mt-1 text-xs text-white/38">Briefings, dossiês, projetos e prazos de execução.</p></div><Toggle checked={prefs.operationUpdatesInApp} onChange={(v)=>set("operationUpdatesInApp",v)} /></div>
      </div></section>

      <section className="rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6"><div className="flex items-center gap-3"><Mail className="h-5 w-5 text-violet-200"/><div><h2 className="font-semibold">E-mail</h2><p className="mt-1 text-sm text-white/40">Preferências já persistidas; motor de disparo será conectado depois.</p></div></div><div className="mt-5 divide-y divide-white/[.07]">
        <div className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-medium">Resumo periódico</p><p className="mt-1 text-xs text-white/38">Resumo das principais movimentações da operação.</p></div><Toggle checked={prefs.emailDigest} onChange={(v)=>set("emailDigest",v)} /></div>
        <div className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-medium">Cobranças vencidas por e-mail</p><p className="mt-1 text-xs text-white/38">Aviso externo de inadimplência quando o disparo de e-mail for ativado.</p></div><Toggle checked={prefs.emailFinanceOverdue} onChange={(v)=>set("emailFinanceOverdue",v)} /></div>
      </div></section>

      <section className="rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6"><div className="flex items-center gap-3"><Smartphone className="h-5 w-5 text-emerald-200"/><div><h2 className="font-semibold">WhatsApp pessoal</h2><p className="mt-1 text-sm text-white/40">Preferência separada do alerta de novos leads que já está em produção.</p></div></div><div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-white/[.07] bg-black/10 p-4"><div><p className="text-sm font-medium">Alertas críticos pelo WhatsApp</p><p className="mt-1 text-xs text-white/38">Prepara seu usuário para futuros alertas críticos financeiros e operacionais.</p></div><Toggle checked={prefs.whatsappCriticalAlerts} onChange={(v)=>set("whatsappCriticalAlerts",v)} /></div></section>
    </div>}

    <div className="mt-6 flex flex-wrap items-center gap-3"><button disabled={saving || loading} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"><Save className="h-4 w-4"/>{saving ? "Salvando…" : "Salvar preferências"}</button>{message&&<p className="text-sm text-emerald-200">{message}</p>}{error&&<p className="text-sm text-rose-200">{error}</p>}</div>
  </div></main>;
}
