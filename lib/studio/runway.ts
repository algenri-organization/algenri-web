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

export type RunwayTask = {
  id: string;
  status?: string;
  output?: string[];
  failure?: string;
  [key: string]: unknown;
};

export function getRunwayIntegrationStatus() {
  return {
    configured: Boolean(process.env.RUNWAYML_API_SECRET),
    environmentVariable: "RUNWAYML_API_SECRET",
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

async function parseRunwayResponse(response: Response) {
  const text = await response.text();
  let payload: unknown = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text }; }
  if (!response.ok) {
    const error = new Error(`runway_api_${response.status}`) as Error & { status?: number; payload?: unknown };
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
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
