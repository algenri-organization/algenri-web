import "server-only";

import { getVercelOidcToken } from "@vercel/oidc";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { getStudioProject } from "@/lib/studio/project-store";
import type { StudioFinalRenderManifest, StudioFinalRenderScene } from "@/lib/studio/final-render";

const SANDBOX_API = "https://api.vercel.com/v2/sandboxes";
const RENDER_TIMEOUT_MS = 12 * 60 * 1000;
const SIGNED_URL_TTL_MS = 25 * 60 * 1000;

function shQuote(value: string) {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function dimensions(aspectRatio: StudioFinalRenderManifest["aspectRatio"]) {
  if (aspectRatio === "9:16") return { width: 1080, height: 1920 };
  if (aspectRatio === "1:1") return { width: 1080, height: 1080 };
  return { width: 1920, height: 1080 };
}

function wrapText(value: string, max = 38) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

function textFileLine(path: string, text: string) {
  const encoded = Buffer.from(text, "utf8").toString("base64");
  return `printf %s ${shQuote(encoded)} | base64 -d > ${shQuote(path)}`;
}

function drawText(input: string, output: string, textPath: string, options: { x: string; y: string; size: number; bold?: boolean }) {
  const font = options.bold
    ? "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    : "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
  return `${input}drawtext=fontfile='${font}':textfile='${textPath}':fontcolor=white:fontsize=${options.size}:box=1:boxcolor=black@0.42:boxborderw=18:x=${options.x}:y=${options.y}:line_spacing=12${output}`;
}

function xy(scene: StudioFinalRenderScene) {
  const align = scene.overlay.align;
  const position = scene.overlay.position;
  const x = align === "center" ? "(w-text_w)/2" : align === "right" ? "w-text_w-w*0.07" : "w*0.07";
  const baseY = position === "top" ? "h*0.10" : position === "bottom" ? "h*0.62" : "h*0.34";
  return { x, baseY };
}

function buildRenderScript(manifest: StudioFinalRenderManifest, sceneUrls: string[], outputUrl: string) {
  const { width, height } = dimensions(manifest.aspectRatio);
  const lines = [
    "set -euo pipefail",
    "cd /tmp",
    "if ! command -v ffmpeg >/dev/null 2>&1; then",
    "  sudo apt-get update -qq",
    "  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ffmpeg fonts-dejavu-core curl",
    "fi",
  ];

  sceneUrls.forEach((url, index) => {
    lines.push(`curl -fsSL --retry 3 ${shQuote(url)} -o ${shQuote(`scene-${index}.mp4`)}`);
  });

  const filters: string[] = [];
  const sceneOutputs: string[] = [];

  manifest.scenes.forEach((scene, index) => {
    const duration = Math.max(1, Number(scene.durationSeconds || 1));
    let current = `[base${index}]`;
    filters.push(`[${index}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},fps=30,format=yuv420p,trim=duration=${duration},setpts=PTS-STARTPTS[base${index}]`);

    if (scene.overlay.enabled) {
      const { x, baseY } = xy(scene);
      const fields = [
        { key: "brand", text: scene.overlay.showBrand ? "ALGENRI" : "", y: `${baseY}`, size: Math.round(height * 0.025), bold: true, wrap: 42 },
        { key: "eyebrow", text: scene.overlay.eyebrow, y: `${baseY}+h*0.052`, size: Math.round(height * 0.026), bold: true, wrap: 42 },
        { key: "headline", text: scene.overlay.headline, y: `${baseY}+h*0.110`, size: Math.round(height * 0.047), bold: true, wrap: 32 },
        { key: "body", text: scene.overlay.body, y: `${baseY}+h*0.205`, size: Math.round(height * 0.024), bold: false, wrap: 46 },
        { key: "cta", text: scene.overlay.cta, y: `${baseY}+h*0.300`, size: Math.round(height * 0.023), bold: true, wrap: 36 },
      ];
      let stage = 0;
      for (const field of fields) {
        if (!field.text?.trim()) continue;
        const textPath = `/tmp/scene-${index}-${field.key}.txt`;
        lines.push(textFileLine(textPath, wrapText(field.text, field.wrap)));
        const next = `[s${index}t${stage}]`;
        filters.push(drawText(current, next, textPath, { x, y: field.y, size: field.size, bold: field.bold }));
        current = next;
        stage += 1;
      }
    }

    const finalLabel = `[scene${index}]`;
    if (manifest.transition === "fade" && duration >= 1.2) {
      filters.push(`${current}fade=t=in:st=0:d=0.35,fade=t=out:st=${Math.max(0.4, duration - 0.35).toFixed(2)}:d=0.35${finalLabel}`);
    } else {
      filters.push(`${current}null${finalLabel}`);
    }
    sceneOutputs.push(finalLabel);
  });

  filters.push(`${sceneOutputs.join("")}concat=n=${sceneOutputs.length}:v=1:a=0[outv]`);
  const inputs = manifest.scenes.map((_, index) => `-i ${shQuote(`/tmp/scene-${index}.mp4`)}`).join(" ");
  lines.push(
    `ffmpeg -hide_banner -loglevel error -y ${inputs} -filter_complex ${shQuote(filters.join(";"))} -map '[outv]' -an -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -movflags +faststart /tmp/final.mp4`,
    `curl -fsS --retry 3 -X PUT -H 'Content-Type: video/mp4' --upload-file /tmp/final.mp4 ${shQuote(outputUrl)}`,
    "echo ALGENRI_RENDER_OK",
  );

  return lines.join("\n");
}

async function vercelToken() {
  const token = await getVercelOidcToken();
  if (!token) throw new Error("studio_sandbox_auth_missing");
  return token;
}

async function apiFetch(url: string, token: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!response.ok) {
    const message = data?.error?.message || data?.message || data?.error || text || `HTTP ${response.status}`;
    throw new Error(`studio_sandbox_api_failed: ${String(message).slice(0, 900)}`);
  }
  return data;
}

async function persist(projectId: string, manifest: StudioFinalRenderManifest) {
  const db = await getAdminDb();
  await db.collection("studioProjects").doc(projectId).set({
    finalRender: manifest,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

function sandboxIds(data: any) {
  const sessionId = data?.session?.id || data?.data?.session?.id || data?.currentSessionId || data?.data?.currentSessionId || (String(data?.id || "").startsWith("sbx_") ? data.id : null);
  return { sessionId: sessionId ? String(sessionId) : null };
}

function commandId(data: any) {
  return data?.command?.id || data?.data?.command?.id || data?.id || null;
}

export async function startStudioSandboxRender(projectId: string): Promise<StudioFinalRenderManifest> {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");
  const manifest = project.finalRender as StudioFinalRenderManifest | undefined;
  if (!manifest || manifest.state !== "prepared") throw new Error("studio_final_render_not_prepared");

  const projectIdVercel = process.env.VERCEL_PROJECT_ID;
  if (!projectIdVercel) throw new Error("studio_sandbox_project_id_missing");
  const token = await vercelToken();
  const storage = await getAdminStorage();
  const bucket = storage.bucket();
  const expires = Date.now() + SIGNED_URL_TTL_MS;

  const sceneUrls = await Promise.all(manifest.scenes.map(async (scene) => {
    const [url] = await bucket.file(scene.storagePath).getSignedUrl({ version: "v4", action: "read", expires });
    return url;
  }));

  const outputStoragePath = `studio/projects/${projectId}/final/ALGENRI-Studio-Final.mp4`;
  const [outputUploadUrl] = await bucket.file(outputStoragePath).getSignedUrl({
    version: "v4",
    action: "write",
    expires,
    contentType: "video/mp4",
  });

  const startedAt = new Date().toISOString();
  const sandbox = await apiFetch(SANDBOX_API, token, {
    method: "POST",
    body: JSON.stringify({
      name: `algenri-render-${projectId.slice(0, 8)}-${Date.now()}`,
      projectId: projectIdVercel,
      runtime: "node24",
      resources: { vcpus: "2", memory: "4096" },
      networkPolicy: { mode: "allow-all" },
      timeout: String(RENDER_TIMEOUT_MS),
      persistent: false,
      tags: { app: "algenri-studio", projectId: projectId.slice(0, 60) },
    }),
  });
  const { sessionId } = sandboxIds(sandbox);
  if (!sessionId) throw new Error(`studio_sandbox_session_missing: ${JSON.stringify(sandbox).slice(0, 600)}`);

  const script = buildRenderScript(manifest, sceneUrls, outputUploadUrl);
  const command = await apiFetch(`${SANDBOX_API}/sessions/${encodeURIComponent(sessionId)}/cmd`, token, {
    method: "POST",
    body: JSON.stringify({
      command: "bash",
      args: ["-lc", script],
      cwd: "/tmp",
      wait: false,
      logs: false,
      timeout: RENDER_TIMEOUT_MS - 30_000,
    }),
  });
  const cmdId = commandId(command);
  if (!cmdId) throw new Error(`studio_sandbox_command_missing: ${JSON.stringify(command).slice(0, 600)}`);

  const rendering: StudioFinalRenderManifest = {
    ...manifest,
    state: "rendering",
    renderEngine: "vercel-sandbox",
    startedAt,
    completedAt: null,
    outputStoragePath,
    outputUrl: null,
    sizeBytes: null,
    contentType: "video/mp4",
    error: null,
    worker: { provider: "vercel-sandbox", sessionId, commandId: String(cmdId), startedAt },
  };
  await persist(projectId, rendering);
  return rendering;
}

async function commandLogs(sessionId: string, cmdId: string, token: string) {
  try {
    const response = await fetch(`${SANDBOX_API}/sessions/${encodeURIComponent(sessionId)}/cmd/${encodeURIComponent(cmdId)}/logs`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const text = await response.text();
    return text.slice(-3000);
  } catch {
    return "";
  }
}

export async function refreshStudioSandboxRender(projectId: string): Promise<StudioFinalRenderManifest | null> {
  const project = await getStudioProject(projectId);
  if (!project) return null;
  const manifest = project.finalRender as StudioFinalRenderManifest | undefined;
  if (!manifest || manifest.state !== "rendering" || manifest.renderEngine !== "vercel-sandbox" || !manifest.worker?.sessionId || !manifest.worker?.commandId) {
    return manifest ?? null;
  }

  const token = await vercelToken();
  const { sessionId, commandId: cmdId } = manifest.worker;
  const data = await apiFetch(`${SANDBOX_API}/sessions/${encodeURIComponent(sessionId)}/cmd/${encodeURIComponent(cmdId)}`, token);
  const command = data?.command || data?.data?.command || data;
  const exitCode = command?.exitCode;
  if (exitCode === undefined || exitCode === null || exitCode === "") return manifest;

  const finishedAt = new Date().toISOString();
  if (String(exitCode) !== "0") {
    const logs = await commandLogs(sessionId, cmdId, token);
    const failed: StudioFinalRenderManifest = {
      ...manifest,
      state: "failed",
      completedAt: finishedAt,
      error: `studio_sandbox_render_failed_exit_${exitCode}${logs ? `: ${logs}` : ""}`.slice(0, 3500),
      worker: { ...manifest.worker, exitCode: String(exitCode), finishedAt },
    };
    await persist(projectId, failed);
    return failed;
  }

  const storage = await getAdminStorage();
  const file = storage.bucket().file(manifest.outputStoragePath || `studio/projects/${projectId}/final/ALGENRI-Studio-Final.mp4`);
  const [exists] = await file.exists();
  if (!exists) return manifest;
  const [metadata] = await file.getMetadata();
  const completed: StudioFinalRenderManifest = {
    ...manifest,
    state: "completed",
    completedAt: finishedAt,
    outputUrl: `/api/internal/studio/projects/${projectId}/final-render/download`,
    contentType: metadata.contentType || "video/mp4",
    sizeBytes: Number(metadata.size || 0) || null,
    error: null,
    worker: { ...manifest.worker, exitCode: "0", finishedAt },
  };
  await persist(projectId, completed);
  return completed;
}
