import "server-only";

import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { readStudioArchivedOutput } from "@/lib/studio/output-storage";
import { getStudioProject } from "@/lib/studio/project-store";
import type { StudioFinalRenderManifest, StudioFinalRenderScene } from "@/lib/studio/final-render";

const execFileAsync = promisify(execFile);

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

async function firstExisting(paths: string[]) {
  for (const candidate of paths) {
    try {
      await access(candidate);
      return candidate;
    } catch {}
  }
  return null;
}

async function resolveFontFile(bold = false) {
  return firstExisting(bold ? [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
  ] : [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
  ]);
}

function drawTextFilter(input: string, output: string, textPath: string, opts: { x: string; y: string; size: number; bold?: boolean; box?: boolean; lineSpacing?: number }, fontFile: string | null) {
  const font = fontFile ? `fontfile='${fontFile}':` : "font='Sans':";
  const box = opts.box === false ? "box=0:" : "box=1:boxcolor=black@0.42:boxborderw=18:";
  return `${input}drawtext=${font}textfile='${textPath}':fontcolor=white:fontsize=${opts.size}:${box}x=${opts.x}:y=${opts.y}:line_spacing=${opts.lineSpacing ?? 8}${output}`;
}

function xy(scene: StudioFinalRenderScene) {
  const align = scene.overlay.align;
  const position = scene.overlay.position;
  const x = align === "center" ? "(w-text_w)/2" : align === "right" ? "w-text_w-w*0.07" : "w*0.07";
  const baseY = position === "top" ? "h*0.10" : position === "bottom" ? "h*0.62" : "h*0.34";
  return { x, baseY };
}

async function persistFinalRender(projectId: string, patch: Record<string, unknown>) {
  const db = await getAdminDb();
  await db.collection("studioProjects").doc(projectId).set({
    finalRender: patch,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function archiveFinal(projectId: string, buffer: Buffer) {
  const storagePath = `studio/projects/${projectId}/final/ALGENRI-Studio-Final.mp4`;
  const storage = await getAdminStorage();
  await storage.bucket().file(storagePath).save(buffer, {
    resumable: false,
    contentType: "video/mp4",
    metadata: {
      cacheControl: "private,max-age=31536000",
      metadata: { studioProjectId: projectId, studioAssetKind: "final-video" },
    },
  });
  return storagePath;
}

export async function renderStudioFinalVideo(projectId: string) {
  if (!ffmpegPath) throw new Error("studio_ffmpeg_unavailable");
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");
  const manifest = project.finalRender as StudioFinalRenderManifest | undefined;
  if (!manifest || manifest.state !== "prepared") throw new Error("studio_final_render_not_prepared");

  const workdir = await mkdtemp(path.join(tmpdir(), `algenri-studio-${projectId.slice(0, 8)}-`));
  const startedAt = new Date().toISOString();
  await persistFinalRender(projectId, { ...manifest, state: "rendering", renderEngine: "ffmpeg-static", startedAt, error: null });

  try {
    const inputPaths: string[] = [];
    for (const scene of manifest.scenes) {
      const archived = await readStudioArchivedOutput(scene.storagePath);
      const inputPath = path.join(workdir, `scene-${scene.sceneIndex}.mp4`);
      await writeFile(inputPath, archived.buffer);
      inputPaths.push(inputPath);
    }

    const regularFont = await resolveFontFile(false);
    const boldFont = await resolveFontFile(true);
    const { width, height } = dimensions(manifest.aspectRatio);
    const filters: string[] = [];
    const sceneOutputs: string[] = [];

    for (let i = 0; i < manifest.scenes.length; i += 1) {
      const scene = manifest.scenes[i];
      const duration = Math.max(1, Number(scene.durationSeconds || 1));
      const fade = manifest.transition === "fade" && duration >= 1.2
        ? `,fade=t=in:st=0:d=0.35,fade=t=out:st=${Math.max(0.4, duration - 0.35).toFixed(2)}:d=0.35`
        : "";
      let current = `[base${i}]`;
      filters.push(`[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},fps=30,format=yuv420p,trim=duration=${duration},setpts=PTS-STARTPTS${fade}[base${i}]`);

      const overlay = scene.overlay;
      if (overlay.enabled) {
        const { x, baseY } = xy(scene);
        const fields = [
          { key: "eyebrow", text: overlay.eyebrow, y: `${baseY}`, size: Math.round(height * 0.026), bold: true, wrap: 42 },
          { key: "headline", text: overlay.headline, y: `${baseY}+h*0.055`, size: Math.round(height * 0.047), bold: true, wrap: 32 },
          { key: "body", text: overlay.body, y: `${baseY}+h*0.145`, size: Math.round(height * 0.024), bold: false, wrap: 46 },
          { key: "cta", text: overlay.cta, y: `${baseY}+h*0.245`, size: Math.round(height * 0.023), bold: true, wrap: 36 },
        ];
        let stage = 0;
        for (const field of fields) {
          if (!field.text?.trim()) continue;
          const textPath = path.join(workdir, `scene-${scene.sceneIndex}-${field.key}.txt`);
          await writeFile(textPath, wrapText(field.text, field.wrap), "utf8");
          const next = `[s${i}t${stage}]`;
          filters.push(drawTextFilter(current, next, textPath, { x, y: field.y, size: field.size, bold: field.bold, box: true, lineSpacing: Math.round(height * 0.008) }, field.bold ? boldFont : regularFont));
          current = next;
          stage += 1;
        }
      }
      const finalLabel = `[scene${i}]`;
      filters.push(`${current}copy${finalLabel}`);
      sceneOutputs.push(finalLabel);
    }

    filters.push(`${sceneOutputs.join("")}concat=n=${sceneOutputs.length}:v=1:a=0[outv]`);
    const outputPath = path.join(workdir, "final.mp4");
    const args: string[] = ["-hide_banner", "-loglevel", "error", "-y"];
    for (const inputPath of inputPaths) args.push("-i", inputPath);
    args.push(
      "-filter_complex", filters.join(";"),
      "-map", "[outv]",
      "-an",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "19",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      outputPath,
    );

    await execFileAsync(ffmpegPath, args, { maxBuffer: 8 * 1024 * 1024, timeout: 280_000 });
    const buffer = await readFile(outputPath);
    const outputStoragePath = await archiveFinal(projectId, buffer);
    const completedAt = new Date().toISOString();
    const completed = {
      ...manifest,
      state: "completed" as const,
      renderEngine: "ffmpeg-static" as const,
      startedAt,
      completedAt,
      outputStoragePath,
      outputUrl: `/api/internal/studio/projects/${projectId}/final-render/download`,
      contentType: "video/mp4",
      sizeBytes: buffer.length,
      error: null,
    };
    await persistFinalRender(projectId, completed);
    return completed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "studio_final_render_failed";
    await persistFinalRender(projectId, { ...manifest, state: "failed", renderEngine: "ffmpeg-static", startedAt, completedAt: new Date().toISOString(), error: message });
    throw error;
  } finally {
    await rm(workdir, { recursive: true, force: true }).catch(() => undefined);
  }
}
