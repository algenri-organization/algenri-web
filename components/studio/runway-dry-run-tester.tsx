"use client";

import { useState } from "react";
import { Bot, CheckCircle2, Clapperboard, Loader2, Play, TriangleAlert } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

const ALGENRI_PROMPT = `Create a premium cinematic brand bumper for ALGENRI, a Brazilian digital solutions and artificial intelligence company. Dark navy futuristic environment, subtle orange and electric blue light accents, elegant flowing data particles becoming a polished digital interface, smooth camera push-in, sophisticated corporate technology aesthetic, realistic lighting, no random text, no subtitles, no watermarks. Native Brazilian Portuguese voiceover, confident and natural, says exactly: "ALGENRI. Ideias inteligentes transformadas em soluções digitais." Keep the spoken line clear and fully audible within five seconds.`;

const TEST_REQUEST = {
  promptText: ALGENRI_PROMPT,
  aspectRatio: "16:9" as const,
  duration: 5,
};

type DryRunResult = {
  ok?: boolean;
  error?: string;
  providerStatus?: number | null;
  costCredits?: number | null;
  routing?: {
    model?: string;
    estimatedCost?: unknown;
    resolvedSettings?: unknown;
    [key: string]: unknown;
  } | null;
};

type GenerationResult = {
  ok?: boolean;
  error?: string;
  taskId?: string;
  costCredits?: number | null;
  routing?: { model?: string; [key: string]: unknown } | null;
};

type TaskResult = {
  ok?: boolean;
  error?: string;
  task?: { id?: string; status?: string | null; output?: string[]; failure?: string | null };
};

async function authRequest(input: RequestInfo | URL, init?: RequestInit) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("not_authenticated");
  const token = await user.getIdToken();
  return fetch(input, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export default function RunwayDryRunTester() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<DryRunResult | null>(null);
  const [generation, setGeneration] = useState<GenerationResult | null>(null);
  const [task, setTask] = useState<TaskResult["task"] | null>(null);

  async function runDryRun() {
    setLoading(true);
    setResult(null);
    setGeneration(null);
    setTask(null);
    try {
      const response = await authRequest("/api/internal/studio/providers/runway/dry-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(TEST_REQUEST),
      });
      const payload = await response.json().catch(() => ({}));
      setResult({ ...payload, ok: response.ok && payload.ok !== false });
    } catch (error) {
      setResult({ ok: false, error: error instanceof Error ? error.message : "network_error" });
    } finally {
      setLoading(false);
    }
  }

  async function pollTask(taskId: string) {
    for (let attempt = 0; attempt < 48; attempt += 1) {
      const response = await authRequest(`/api/internal/studio/providers/runway/tasks/${encodeURIComponent(taskId)}`);
      const payload = (await response.json().catch(() => ({}))) as TaskResult;
      if (!response.ok || payload.ok === false) throw new Error(payload.error ?? "task_status_failed");
      setTask(payload.task ?? null);
      const status = String(payload.task?.status ?? "").toUpperCase();
      if (["SUCCEEDED", "SUCCESS", "COMPLETED"].includes(status)) return;
      if (["FAILED", "CANCELED", "CANCELLED"].includes(status)) throw new Error(payload.task?.failure ?? "generation_failed");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    throw new Error("task_timeout");
  }

  async function generatePreview() {
    if (!result?.ok || !result.routing) return;
    setGenerating(true);
    setGeneration(null);
    setTask(null);
    try {
      const response = await authRequest("/api/internal/studio/providers/runway/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...TEST_REQUEST, confirmSpend: true }),
      });
      const payload = (await response.json().catch(() => ({}))) as GenerationResult;
      setGeneration({ ...payload, ok: response.ok && payload.ok !== false });
      if (!response.ok || payload.ok === false || !payload.taskId) throw new Error(payload.error ?? "generation_start_failed");
      await pollTask(payload.taskId);
    } catch (error) {
      setGeneration(current => ({ ...current, ok: false, error: error instanceof Error ? error.message : "generation_failed" }));
    } finally {
      setGenerating(false);
    }
  }

  const success = result?.ok && result.routing;
  const outputUrl = task?.output?.[0];
  const taskStatus = String(task?.status ?? "").toUpperCase();

  return <section className="mt-5 rounded-[26px] border border-cyan-300/15 bg-cyan-300/[.025] p-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-cyan-200"><Bot className="h-4 w-4"/> Primeiro preview real</div>
        <h2 className="mt-2 text-lg font-semibold">ALGENRI · bumper cinematográfico de 5 segundos</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">Primeiro fazemos o dry run sem custo. Só depois da estimativa aparecer o botão de confirmação da geração paga. A peça foi pensada para poder ser reaproveitada como abertura curta da marca.</p>
        <div className="mt-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-xs leading-5 text-white/45"><span className="font-semibold text-white/65">Locução:</span> “ALGENRI. Ideias inteligentes transformadas em soluções digitais.”</div>
      </div>
      <button type="button" onClick={runDryRun} disabled={loading || generating} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[.08] px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/[.12] disabled:cursor-wait disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Play className="h-4 w-4"/>}
        {loading ? "Calculando..." : "Calcular antes de gerar"}
      </button>
    </div>

    {success && <div className="mt-5 border-t border-white/10 pt-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.035] p-4"><div className="flex items-center gap-2 text-xs font-semibold text-emerald-200"><CheckCircle2 className="h-4 w-4"/> Dry run aprovado</div><p className="mt-2 text-xs text-white/40">Nenhuma mídia foi gerada e nenhum crédito foi consumido nesta etapa.</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Motor selecionado</p><p className="mt-2 text-sm font-semibold text-white/75">{result.routing?.model ?? "Informado pelo Router"}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Custo estimado</p><p className="mt-2 text-sm font-semibold text-white/75">{typeof result.costCredits === "number" ? `${result.costCredits} créditos` : "Consultar confirmação do Router"}</p></div>
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[.025] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-amber-100">Confirmação de gasto</p><p className="mt-1 text-xs text-white/40">Este botão dispara uma geração real de 5 segundos no Runway. A ação não é automática e só ocorre após este clique.</p></div><button type="button" onClick={generatePreview} disabled={generating} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[.08] px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/[.12] disabled:cursor-wait disabled:opacity-50">{generating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Clapperboard className="h-4 w-4"/>}{generating ? "Gerando e acompanhando..." : `Gerar vídeo de 5s${typeof result.costCredits === "number" ? ` · ~${result.costCredits} créditos` : ""}`}</button></div>
    </div>}

    {generation?.taskId && <div className="mt-5 rounded-2xl border border-violet-300/15 bg-violet-300/[.025] p-4"><p className="text-xs font-semibold uppercase tracking-[.12em] text-violet-200">Job Runway</p><p className="mt-2 text-sm text-white/65">{generation.taskId}</p><p className="mt-1 text-xs text-white/40">Status: {task?.status ?? "enviado"}</p></div>}

    {outputUrl && ["SUCCEEDED", "SUCCESS", "COMPLETED"].includes(taskStatus) && <div className="mt-5 overflow-hidden rounded-[22px] border border-emerald-300/15 bg-black/25 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-200"><CheckCircle2 className="h-4 w-4"/> Primeiro vídeo gerado pelo ALGENRI Studio</div><video src={outputUrl} controls playsInline className="w-full rounded-xl"/><a href={outputUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-semibold text-cyan-200 hover:text-cyan-100">Abrir arquivo original do Runway</a></div>}

    {result && !result.ok && <div className="mt-5 flex gap-3 border-t border-white/10 pt-4"><TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-100"/><div><p className="text-sm font-semibold text-amber-100">Não foi possível calcular o preview</p><p className="mt-1 text-xs leading-5 text-white/40">Código: {result.error ?? "unknown_error"}{result.providerStatus ? ` · Runway ${result.providerStatus}` : ""}. Nenhuma geração paga foi executada.</p></div></div>}
    {generation && !generation.ok && <div className="mt-5 flex gap-3 border-t border-white/10 pt-4"><TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-200"/><div><p className="text-sm font-semibold text-rose-200">A geração não foi concluída</p><p className="mt-1 text-xs leading-5 text-white/40">Código: {generation.error ?? "generation_failed"}. Verifique o saldo, elegibilidade do motor e logs antes de tentar novamente.</p></div></div>}
  </section>;
}
