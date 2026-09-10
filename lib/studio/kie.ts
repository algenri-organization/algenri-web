import "server-only";

const KIE_API_BASE = "https://api.kie.ai";

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
    const error = new Error("kie_request_failed") as Error & { status?: number; payload?: unknown };
    error.status = response.status;
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
