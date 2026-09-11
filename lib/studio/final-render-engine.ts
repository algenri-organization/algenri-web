import "server-only";

import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { readStudioArchivedOutput } from "@/lib/studio/output-storage";
import { getStudioProject } from "@/lib/studio/project-store";
import type { StudioFinalRenderManifest } from "@/lib/studio/final-render";
import { renderStudioSceneOverlayImage } from "@/lib/studio/render-overlay-image";

const execFileAsync = promisify(execFile);

function dimensions(aspectRatio: StudioFinalRenderManifest["aspectRatio"]) {
  if (aspectRatio === "9:16") return { width: 720, height: 1280 };
  if (aspectRatio === "1:1") return { width: 960, height: 960 };
  return { width: 1280, height: 720 };
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

function ffmpegFailureDetail(error: unknown) {
  if (!(error instanceof Error)) return "studio_final_render_failed";
  const processError = error as Error & { stderr?: string | Buffer; stdout?: string | Buffer; code?: string | number };
  const stderr = typeof processError.stderr === "string"
    ? processError.stderr
    : Buffer.isBuffer(processError.stderr)
      ? processError.stderr.toString("utf8")
      : "";
  const stdout = typeof processError.stdout === "string"
    ? processError.stdout
    : Buffer.isBuffer(processError.stdout)
      ? processError.stdout.toString("utf8")
      : "";
  const diagnostic = (stderr || stdout).trim();
  const code = processError.code != null ? ` [exit ${processError.code}]` : "";
  return diagnostic ? `FFmpeg${code}: ${diagnostic.slice(0, 6000)}` : `${error.message}${code}`;
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
    const overlayPaths: string[] = [];

    for (const scene of manifest.scenes) {
      let archived;
      try {
        archived = await readStudioArchivedOutput(scene.storagePath);
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown_storage_error";
        throw new Error(`studio_scene_load_failed_${scene.sceneIndex}: ${message}`);
      }

      const inputPath = path.join(workdir, `scene-${scene.sceneIndex}.mp4`);
      await writeFile(inputPath, archived.buffer);
      inputPaths.push(inputPath);

      const overlayPath = path.join(workdir, `scene-${scene.sceneIndex}-overlay.png`);
      try {
        const overlayBuffer = await renderStudioSceneOverlayImage(scene, manifest.aspectRatio);
        await writeFile(overlayPath, overlayBuffer);
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown_overlay_error";
        throw new Error(`studio_overlay_stage_failed_${scene.sceneIndex}: ${message}`);
      }
      overlayPaths.push(overlayPath);
    }

    const { width, height } = dimensions(manifest.aspectRatio);
    const filters: string[] = [];
    const sceneOutputs: string[] = [];
    const overlayOffset = inputPaths.length;

    for (let i = 0; i < manifest.scenes.length; i += 1) {
      const scene = manifest.scenes[i];
      const duration = Math.max(1, Number(scene.durationSeconds || 1));
      filters.push(`[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},fps=30,format=yuv420p,trim=duration=${duration},setpts=PTS-STARTPTS[base${i}]`);
      filters.push(`[${overlayOffset + i}:v]format=rgba[overlay${i}]`);
      filters.push(`[base${i}][overlay${i}]overlay=0:0:format=auto:eof_action=repeat:repeatlast=1[composed${i}]`);

      const finalLabel = `[scene${i}]`;
      if (manifest.transition === "fade" && duration >= 1.2) {
        filters.push(`[composed${i}]fade=t=in:st=0:d=0.35,fade=t=out:st=${Math.max(0.4, duration - 0.35).toFixed(2)}:d=0.35${finalLabel}`);
      } else {
        filters.push(`[composed${i}]null${finalLabel}`);
      }
      sceneOutputs.push(finalLabel);
    }

    filters.push(`${sceneOutputs.join("")}concat=n=${sceneOutputs.length}:v=1:a=0[outv]`);
    const outputPath = path.join(workdir, "final.mp4");
    const args: string[] = ["-hide_banner", "-loglevel", "error", "-y"];
    for (const inputPath of inputPaths) args.push("-i", inputPath);
    for (const overlayPath of overlayPaths) args.push("-loop", "1", "-i", overlayPath);
    args.push(
      "-filter_complex", filters.join(";"),
      "-map", "[outv]",
      "-an",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "20",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      outputPath,
    );

    try {
      await execFileAsync(ffmpegPath, args, { maxBuffer: 8 * 1024 * 1024, timeout: 280_000 });
    } catch (error) {
      throw new Error(ffmpegFailureDetail(error));
    }

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
