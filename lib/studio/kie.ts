import "server-only";

// Build marker: forces a real Vercel production build after the Pro upgrade.
const KIE_API_BASE = "https://api.kie.ai";
export const KIE_STUDIO_VIDEO_MODEL = "kling-2.6/text-to-video";

function getApiKey() {
  const apiKey = process.env.KIE_API_KEY?.trim();
  if (!apiKey) throw new Error("kie_not_configured");
  return apiKey;
}

async function kieFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${KIE_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || (typeof payload?.code === "number" && payload.code !== 200)) {
    const providerCode = Number(payload?.code);
    const status = response.status || (Number.isFinite(providerCode) ? providerCode : 500);
    const code = status === 402 || providerCode === 402
      ? "kie_insufficient_credits"
      : status === 401 || providerCode === 401
        ? "kie_unauthorized"
        : status === 422 || providerCode === 422
          ? "kie_validation_failed"
          : status === 429 || providerCode === 429
            ? "kie_rate_limited"
            : "kie_request_failed";
    const error = new Error(code) as Error & { status?: number; payload?: unknown };
    error.status = status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export function getKieIntegrationStatus() {
  return {
    configured: Boolean(process.env.KIE_API_KEY?.trim()),
    environmentVariable: "KIE_API_KEY",
    apiBase: KIE_API_BASE,
    supportsBalanceCheck: true,
    supportsUnifiedJobs: true,
    supportsTaskStatus: true,
    executableVideoModel: KIE_STUDIO_VIDEO_MODEL,
  };
}

export async function getKieCreditBalance(): Promise<number | null> {
  const payload = await kieFetch("/api/v1/chat/credit", { method: "GET" });
  const value = Number(payload?.data);
  return Number.isFinite(value) ? value : null;
}

export type KieVideoTaskInput = {
  model: string;
  prompt: string;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "adaptive";
  duration?: number;
  resolution?: string;
  audio?: boolean;
  callbackUrl?: string;
  extraInput?: Record<string, unknown>;
};

export async function createKieVideoTask(input: KieVideoTaskInput) {
  const body = {
    model: input.model,
    ...(input.callbackUrl ? { callBackUrl: input.callbackUrl } : {}),
    input: {
      prompt: input.prompt,
      ...(input.aspectRatio ? { aspect_ratio: input.aspectRatio } : {}),
      ...(input.duration ? { duration: input.duration } : {}),
      ...(input.resolution ? { resolution: input.resolution } : {}),
      ...(typeof input.audio === "boolean" ? { audio: input.audio } : {}),
      ...(input.extraInput ?? {}),
    },
  };

  const payload = await kieFetch("/api/v1/jobs/createTask", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const taskId = payload?.data?.taskId ?? null;
  if (!taskId) throw new Error("kie_missing_task_id");
  return { taskId: String(taskId), payload };
}

export function normalizeKieKling26Duration(seconds: number): 5 | 10 {
  return Math.max(1, Math.round(seconds)) <= 5 ? 5 : 10;
}

export function canKieKling26RenderScene(seconds: number) {
  const normalized = Math.max(1, Math.round(seconds));
  return normalized <= 10;
}

export async function createKieKling26TextToVideo(input: {
  prompt: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  durationSeconds: number;
  sound?: boolean;
  callbackUrl?: string;
}) {
  if (!canKieKling26RenderScene(input.durationSeconds)) throw new Error("kie_scene_duration_unsupported");
  const duration = normalizeKieKling26Duration(input.durationSeconds);
  return createKieVideoTask({
    model: KIE_STUDIO_VIDEO_MODEL,
    prompt: input.prompt,
    aspectRatio: input.aspectRatio,
    callbackUrl: input.callbackUrl,
    extraInput: {
      duration: String(duration),
      sound: input.sound ?? false,
    },
  });
}

export type KieTaskDetails = {
  taskId: string;
  model: string | null;
  state: string;
  progress: number | null;
  resultUrls: string[];
  failCode: string | null;
  failMsg: string | null;
  creditsConsumed: number | null;
};

export async function getKieTaskDetails(taskId: string): Promise<KieTaskDetails> {
  const payload = await kieFetch(`/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, { method: "GET" });
  const data = payload?.data ?? {};
  let resultUrls: string[] = [];
  try {
    const result = typeof data.resultJson === "string" ? JSON.parse(data.resultJson) : data.resultJson;
    if (Array.isArray(result?.resultUrls)) resultUrls = result.resultUrls.filter((value: unknown): value is string => typeof value === "string");
  } catch {
    resultUrls = [];
  }
  return {
    taskId: String(data.taskId ?? taskId),
    model: typeof data.model === "string" ? data.model : null,
    state: String(data.state ?? "waiting"),
    progress: Number.isFinite(Number(data.progress)) ? Number(data.progress) : null,
    resultUrls,
    failCode: typeof data.failCode === "string" && data.failCode ? data.failCode : null,
    failMsg: typeof data.failMsg === "string" && data.failMsg ? data.failMsg : null,
    creditsConsumed: Number.isFinite(Number(data.creditsConsumed)) ? Number(data.creditsConsumed) : null,
  };
}
