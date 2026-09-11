import "server-only";

export const RUNWAY_API_BASE = "https://api.dev.runwayml.com/v1";
export const RUNWAY_API_VERSION = "2024-11-06";

export type RunwayVideoModel = "gen4.5" | "gen4_turbo" | "veo3.1";

export type RunwayImageToVideoRequest = {
  promptImage: string;
  promptText: string;
  model: RunwayVideoModel;
  ratio: "1280:720" | "720:1280";
  duration: number;
};

export type RunwayRouterVideoInput = {
  promptText: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  duration: number;
  referenceImageUrl?: string;
};

export type RunwayTask = {
  id?: string;
  taskId?: string;
  status?: string;
  output?: string[];
  failure?: string;
  routing?: Record<string, unknown>;
  [key: string]: unknown;
};

export type RunwayRouterDryRun = {
  routing?: {
    model?: string;
    estimatedCost?: number | string | { credits?: number | string };
    resolvedSettings?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function getRunwayIntegrationStatus() {
  const configured = Boolean(process.env.RUNWAYML_API_SECRET);
  const routerConfigured = Boolean(process.env.RUNWAY_MODEL_ROUTER_ID);
  return {
    configured,
    routerConfigured,
    readyForDryRun: configured && routerConfigured,
    environmentVariable: "RUNWAYML_API_SECRET",
    routerEnvironmentVariable: "RUNWAY_MODEL_ROUTER_ID",
    apiBase: RUNWAY_API_BASE,
    apiVersion: RUNWAY_API_VERSION,
  };
}

function runwayHeaders() {
  const secret = process.env.RUNWAYML_API_SECRET;
  if (!secret) throw new Error("runway_not_configured");
  return {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
    "X-Runway-Version": RUNWAY_API_VERSION,
  };
}

function extractRunwayErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Record<string, unknown>;
  const direct = [value.message, value.msg, value.error, value.detail, value.details];
  for (const item of direct) {
    if (typeof item === "string" && item.trim()) return item.trim();
    if (item && typeof item === "object") {
      const nested = item as Record<string, unknown>;
      for (const candidate of [nested.message, nested.msg, nested.detail, nested.reason]) {
        if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
      }
    }
  }
  return null;
}

function isRunwayCreditError(detail: string | null) {
  if (!detail) return false;
  return /not enough credits|insufficient credits|insufficient credit|credit balance/i.test(detail);
}

async function parseRunwayResponse(response: Response) {
  const text = await response.text();
  let payload: unknown = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text }; }
  if (!response.ok) {
    const detail = extractRunwayErrorMessage(payload);
    const creditError = isRunwayCreditError(detail);
    const apiCode = `runway_api_${response.status}`;
    const structuredCode = creditError ? "runway_insufficient_credits" : apiCode;
    const friendlyCreditMessage = "O Runway recusou a geração por saldo insuficiente na organização da API. Verifique os créditos/autobilling no Runway Dev ou escolha outro motor disponível.";
    const errorPayload = creditError
      ? { ...(payload && typeof payload === "object" ? payload as Record<string, unknown> : {}), msg: friendlyCreditMessage, providerMessage: detail }
      : payload;
    const error = new Error(structuredCode) as Error & { status?: number; payload?: unknown; code?: string; providerMessage?: string | null };
    error.status = creditError ? 402 : response.status;
    error.payload = errorPayload;
    error.code = structuredCode;
    error.providerMessage = detail;
    throw error;
  }
  return payload;
}

export function normalizeRunwayRouterDuration(seconds: number) {
  const duration = Math.max(1, Math.round(seconds));
  if (duration <= 5) return 5;
  if (duration <= 10) return 10;
  return duration;
}

function routerPayload(input: RunwayRouterVideoInput, dryRun: boolean) {
  const configId = process.env.RUNWAY_MODEL_ROUTER_ID;
  if (!configId) throw new Error("runway_router_not_configured");
  const referenceImages = input.referenceImageUrl ? [{ uri: input.referenceImageUrl, role: "first" }] : undefined;
  return {
    configId,
    ...(dryRun ? { dryRun: true } : {}),
    input: {
      promptText: input.promptText,
      aspectRatio: input.aspectRatio,
      duration: normalizeRunwayRouterDuration(input.duration),
      ...(referenceImages ? { referenceImages } : {}),
    },
  };
}

export function extractRunwayRoutingCost(routing?: Record<string, unknown> | null) {
  if (!routing) return null;
  const candidates = [routing.estimatedCost, routing.realizedCost, routing.cost, routing.credits];
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === "string" && candidate.trim() && Number.isFinite(Number(candidate))) return Number(candidate);
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      for (const value of [nested.credits, nested.amount, nested.value]) {
        if (typeof value === "number" && Number.isFinite(value)) return value;
        if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
      }
    }
  }
  return null;
}

export async function createRunwayImageToVideo(input: RunwayImageToVideoRequest) {
  const response = await fetch(`${RUNWAY_API_BASE}/image_to_video`, {
    method: "POST",
    headers: runwayHeaders(),
    body: JSON.stringify(input),
    cache: "no-store",
  });
  return parseRunwayResponse(response) as Promise<RunwayTask>;
}

export async function dryRunRunwayVideoRouter(input: RunwayRouterVideoInput) {
  const response = await fetch(`${RUNWAY_API_BASE}/generate/video`, {
    method: "POST",
    headers: runwayHeaders(),
    body: JSON.stringify(routerPayload(input, true)),
    cache: "no-store",
  });
  return parseRunwayResponse(response) as Promise<RunwayRouterDryRun>;
}

export async function generateRunwayVideoRouter(input: RunwayRouterVideoInput) {
  const response = await fetch(`${RUNWAY_API_BASE}/generate/video`, {
    method: "POST",
    headers: runwayHeaders(),
    body: JSON.stringify(routerPayload(input, false)),
    cache: "no-store",
  });
  return parseRunwayResponse(response) as Promise<RunwayTask>;
}

export async function getRunwayTask(taskId: string) {
  const response = await fetch(`${RUNWAY_API_BASE}/tasks/${encodeURIComponent(taskId)}`, {
    headers: runwayHeaders(),
    cache: "no-store",
  });
  return parseRunwayResponse(response) as Promise<RunwayTask>;
}

export function estimateRunwayVideoCredits(model: RunwayVideoModel, durationSeconds: number, generateAudio = true) {
  const seconds = Math.max(1, Math.ceil(durationSeconds));
  if (model === "gen4_turbo") return { credits: seconds * 5, source: "runway-public-pricing" as const };
  if (model === "gen4.5") return { credits: seconds * 12, source: "runway-public-pricing" as const };
  return { credits: seconds * (generateAudio ? 40 : 20), source: "runway-public-pricing" as const };
}
