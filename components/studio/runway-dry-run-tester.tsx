"use client";

import { useState } from "react";
import { Bot, CheckCircle2, Loader2, Play, TriangleAlert } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type DryRunResult = {
  ok?: boolean;
  error?: string;
  providerStatus?: number | null;
  routing?: {
    model?: string;
    estimatedCost?: number;
    resolvedSettings?: unknown;
    [key: string]: unknown;
  } | null;
};

export default function RunwayDryRunTester() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DryRunResult | null>(null);

  async function runDryRun() {
    setLoading(true);
    setResult(null);
    try {
      const user = firebaseAuth.currentUser;
      if (!user) {
        setResult({ ok: false, error: "not_authenticated" });
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch("/api/internal/studio/providers/runway/dry-run", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptText: "Cinematic technology studio interior, subtle camera push-in, premium lighting, clean composition",
          aspectRatio: "16:9",
          duration: 5,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      setResult({ ...payload, ok: response.ok && payload.ok !== false });
    } catch {
      setResult({ ok: false, error: "network_error" });
    } finally {
      setLoading(false);
    }
  }

  const success = result?.ok && result.routing;

  return <section className="mt-5 rounded-[26px] border border-cyan-300/15 bg-cyan-300/[.025] p-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-cyan-200"><Bot className="h-4 w-4"/> Teste seguro do roteador</div>
        <h2 className="mt-2 text-lg font-semibold">Dry run sem geração e sem consumo de créditos</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">Executa uma solicitação de vídeo de 5 segundos apenas para validar autenticação, Config ID, elegibilidade dos modelos e estimativa de custo. Nenhuma mídia é gerada.</p>
      </div>
      <button type="button" onClick={runDryRun} disabled={loading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[.08] px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/[.12] disabled:cursor-wait disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Play className="h-4 w-4"/>}
        {loading ? "Testando..." : "Executar dry run"}
      </button>
    </div>

    {success && <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 md:grid-cols-3">
      <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.035] p-4"><div className="flex items-center gap-2 text-xs font-semibold text-emerald-200"><CheckCircle2 className="h-4 w-4"/> Conexão validada</div><p className="mt-2 text-xs text-white/40">A ALGENRI conseguiu consultar o Model Router sem gerar mídia.</p></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Motor selecionado</p><p className="mt-2 text-sm font-semibold text-white/75">{result.routing?.model ?? "Informado pelo Router"}</p></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Custo estimado</p><p className="mt-2 text-sm font-semibold text-white/75">{typeof result.routing?.estimatedCost === "number" ? `${result.routing.estimatedCost} créditos` : "Informado pelo Router"}</p></div>
    </div>}

    {result && !result.ok && <div className="mt-5 flex gap-3 border-t border-white/10 pt-4"><TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-100"/><div><p className="text-sm font-semibold text-amber-100">Não foi possível validar o dry run</p><p className="mt-1 text-xs leading-5 text-white/40">Código: {result.error ?? "unknown_error"}{result.providerStatus ? ` · Runway ${result.providerStatus}` : ""}. Nenhuma geração paga foi executada.</p></div></div>}
  </section>;
}
