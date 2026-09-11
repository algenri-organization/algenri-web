import "server-only";

import { Sandbox } from "@vercel/sandbox";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { getStudioProject } from "@/lib/studio/project-store";
import type { StudioFinalRenderManifest, StudioFinalRenderScene } from "@/lib/studio/final-render";

const RENDER_TIMEOUT_MS = 12 * 60 * 1000;
const SIGNED_URL_TTL_MS = 25 * 60 * 1000;
const FAILURE_GRACE_MS = 14 * 60 * 1000;

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

function textFileLine(filePath: string, text: string) {
  const encoded = Buffer.from(text, "utf8").toString("base64");
  return `printf %s ${shQuote(encoded)} | base64 -d > ${shQuote(filePath)}`;
}

function drawText(input: string, output: string, textPath: string, options: { x: string; y: string; size: number; bold?: boolean }) {
  const font = options.bold
    ? "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Bold.ttf"
    : "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf";
  return `${input}drawtext=fontfile='${font}':textfile='${textPath}':fontcolor=white:fontsize=${options.size}:box=1:boxcolor=black@0.42:boxborderw=18:x=${options.x}:y=${options.y}:line_spacing=12${output}`;
}

function xy(scene: StudioFinalRenderScene) {
  const align = scene.overlay.align;
  const position = scene.overlay.position;
  const x = align === "center" ? "(w-text_w)/2" : align === "right" ? "w-text_w-w*0.07" : "w*0.07";
  const baseY = position === "top" ? "h*0.10" : position === "bottom" ? "h*0.62" : "h*0.34";
  return { x, baseY };
}

function buildRenderScript(manifest: StudioFinalRenderManifest, sceneUrls: string[], outputUrl: string, statusUrl: string) {
  const { width, height } = dimensions(manifest.aspectRatio);
  const lines = [
    "set -euo pipefail",
    "cd /tmp",
    `STATUS_URL=${shQuote(statusUrl)}`,
    "STEP=bootstrap",
    "report_failed() { code=$?; detail=$( (tail -c 1800 /tmp/bootstrap.log 2>/dev/null || true; tail -c 2200 /tmp/render.log 2>/dev/null || true) | tr '\\n' ' ' | tr -cd '[:print:]' ); printf 'failed:%s:%s:%s' \"$code\" \"${STEP:-unknown}\" \"$detail\" | curl -fsS --retry 2 -X PUT -H 'Content-Type: text/plain' --data-binary @- \"$STATUS_URL\" >/dev/null 2>&1 || true; exit \"$code\"; }",
    "trap report_failed ERR",
    "FFMPEG=$(command -v ffmpeg || true)",
    "if [ -z \"$FFMPEG\" ]; then",
    "  ARCH=$(uname -m)",
    "  case \"$ARCH\" in",
    "    x86_64|amd64) FFMPEG_ARCH=linux64 ;;",
    "    aarch64|arm64) FFMPEG_ARCH=linuxarm64 ;;",
    "    *) echo \"unsupported architecture: $ARCH\" >/tmp/bootstrap.log; false ;;",
    "  esac",
    "  sudo dnf install -y xz dejavu-sans-fonts >/tmp/bootstrap.log 2>&1",
    "  FFMPEG_URL=\"https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-${FFMPEG_ARCH}-gpl.tar.xz\"",
    "  curl -fL --retry 3 --connect-timeout 20 \"$FFMPEG_URL\" -o /tmp/ffmpeg.tar.xz >>/tmp/bootstrap.log 2>&1",
    "  rm -rf /tmp/ffmpeg-dist && mkdir -p /tmp/ffmpeg-dist",
    "  tar -xJf /tmp/ffmpeg.tar.xz --strip-components=1 -C /tmp/ffmpeg-dist >>/tmp/bootstrap.log 2>&1",
    "  FFMPEG=/tmp/ffmpeg-dist/bin/ffmpeg",
    "fi",
    "sudo dnf install -y dejavu-sans-fonts >>/tmp/bootstrap.log 2>&1 || true",
    "test -x \"$FFMPEG\"",
    "test -f /usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf",
    "STEP=verify_ffmpeg",
    "\"$FFMPEG\" -hide_banner -filters > /tmp/filters.txt 2>/tmp/render.log",
    "grep -q ' drawtext ' /tmp/filters.txt",
  ];

  sceneUrls.forEach((url, index) => {
    lines.push(`STEP=download_scene_${index}`);
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
    "STEP=ffmpeg_render",
    `\"$FFMPEG\" -hide_banner -loglevel error -y ${inputs} -filter_complex ${shQuote(filters.join(";"))} -map '[outv]' -an -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -movflags +faststart /tmp/final.mp4 2>/tmp/render.log`,
    "STEP=upload_output",
    `curl -fsS --retry 3 -X PUT -H 'Content-Type: video/mp4' --upload-file /tmp/final.mp4 ${shQuote(outputUrl)}`,
    "STEP=complete_status",
    `printf completed | curl -fsS --retry 3 -X PUT -H 'Content-Type: text/plain' --data-binary @- ${shQuote(statusUrl)}`,
    "trap - ERR",
    "echo ALGENRI_RENDER_OK",
  );

  return lines.join("\n");
}

async function persist(projectId: string, manifest: StudioFinalRenderManifest) {
  const db = await getAdminDb();
  await db.collection("studioProjects").doc(projectId).set({
    finalRender: manifest,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function startStudioSandboxRender(projectId: string): Promise<StudioFinalRenderManifest> {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");
  const manifest = project.finalRender as StudioFinalRenderManifest | undefined;
  if (!manifest || manifest.state !== "prepared") throw new Error("studio_final_render_not_prepared");

  const storage = await getAdminStorage();
  const bucket = storage.bucket();
  const expires = Date.now() + SIGNED_URL_TTL_MS;

  const sceneUrls = await Promise.all(manifest.scenes.map(async (scene) => {
    const [url] = await bucket.file(scene.storagePath).getSignedUrl({ version: "v4", action: "read", expires });
    return url;
  }));

  const outputStoragePath = `studio/projects/${projectId}/final/ALGENRI-Studio-Final.mp4`;
  const statusStoragePath = `studio/projects/${projectId}/final/render-status.txt`;
  await Promise.all([
    bucket.file(outputStoragePath).delete({ ignoreNotFound: true }).catch(() => undefined),
    bucket.file(statusStoragePath).delete({ ignoreNotFound: true }).catch(() => undefined),
  ]);

  const [outputUploadUrl] = await bucket.file(outputStoragePath).getSignedUrl({
    version: "v4",
    action: "write",
    expires,
    contentType: "video/mp4",
  });
  const [statusUploadUrl] = await bucket.file(statusStoragePath).getSignedUrl({
    version: "v4",
    action: "write",
    expires,
    contentType: "text/plain",
  });

  const startedAt = new Date().toISOString();
  let sandbox: Sandbox;
  try {
    sandbox = await Sandbox.create({
      name: `algenri-render-${projectId.slice(0, 8)}-${Date.now()}`,
      runtime: "node24",
      resources: { vcpus: 2 },
      timeout: RENDER_TIMEOUT_MS,
      persistent: false,
      tags: { app: "algenri-studio", project: projectId.slice(0, 50) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`studio_sandbox_create_failed: ${message.slice(0, 900)}`);
  }

  const script = buildRenderScript(manifest, sceneUrls, outputUploadUrl, statusUploadUrl);
  let commandId = "";
  try {
    const command = await sandbox.runCommand({
      cmd: "bash",
      args: ["-lc", script],
      cwd: "/tmp",
      detached: true,
    });
    commandId = command.cmdId;
  } catch (error) {
    await sandbox.stop().catch(() => undefined);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`studio_sandbox_command_start_failed: ${message.slice(0, 900)}`);
  }

  if (!commandId) throw new Error("studio_sandbox_command_id_missing");

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
    worker: {
      provider: "vercel-sandbox",
      sandboxName: sandbox.name,
      commandId,
      statusStoragePath,
      startedAt,
    },
  };
  await persist(projectId, rendering);
  return rendering;
}

export async function refreshStudioSandboxRender(projectId: string): Promise<StudioFinalRenderManifest | null> {
  const project = await getStudioProject(projectId);
  if (!project) return null;
  const manifest = project.finalRender as StudioFinalRenderManifest | undefined;
  if (!manifest || manifest.state !== "rendering" || manifest.renderEngine !== "vercel-sandbox" || !manifest.worker?.statusStoragePath) {
    return manifest ?? null;
  }

  const storage = await getAdminStorage();
  const bucket = storage.bucket();
  const statusFile = bucket.file(manifest.worker.statusStoragePath);
  const [statusExists] = await statusFile.exists();

  if (statusExists) {
    const [statusBuffer] = await statusFile.download();
    const status = statusBuffer.toString("utf8").trim();
    const finishedAt = new Date().toISOString();

    if (status.startsWith("failed")) {
      const failed: StudioFinalRenderManifest = {
        ...manifest,
        state: "failed",
        completedAt: finishedAt,
        error: `studio_sandbox_render_${status}`.slice(0, 3200),
        worker: { ...manifest.worker, exitCode: status.split(":")[1] || "1", finishedAt },
      };
      await persist(projectId, failed);
      return failed;
    }

    if (status === "completed") {
      const outputFile = bucket.file(manifest.outputStoragePath || `studio/projects/${projectId}/final/ALGENRI-Studio-Final.mp4`);
      const [exists] = await outputFile.exists();
      if (!exists) return manifest;
      const [metadata] = await outputFile.getMetadata();
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
  }

  const startedMs = Date.parse(manifest.startedAt || manifest.worker.startedAt || "");
  if (Number.isFinite(startedMs) && Date.now() - startedMs > FAILURE_GRACE_MS) {
    const finishedAt = new Date().toISOString();
    const failed: StudioFinalRenderManifest = {
      ...manifest,
      state: "failed",
      completedAt: finishedAt,
      error: "studio_sandbox_render_timeout_no_status",
      worker: { ...manifest.worker, exitCode: "timeout", finishedAt },
    };
    await persist(projectId, failed);
    return failed;
  }

  return manifest;
}
