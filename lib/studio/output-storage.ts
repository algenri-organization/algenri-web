import "server-only";

import { execFile } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import { getAdminStorage } from "@/lib/firebase/admin";

const execFileAsync = promisify(execFile);

export type StudioArchivedOutput = {
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  archivedAt: string;
  continuityFrameStoragePath?: string | null;
  continuityFrameContentType?: string | null;
  continuityFrameError?: string | null;
};

async function extractContinuityFrame(input: { projectId: string; sceneIndex: number; taskId: string; videoBuffer: Buffer }) {
  if (!ffmpegPath) return { continuityFrameStoragePath: null, continuityFrameContentType: null, continuityFrameError: "ffmpeg_static_unavailable" };
  const safeTask = input.taskId.replace(/[^a-z0-9_-]/gi, "-");
  const base = path.join(os.tmpdir(), `studio-continuity-${input.projectId}-${input.sceneIndex}-${safeTask}-${Date.now()}`);
  const inputPath = `${base}.mp4`;
  const outputPath = `${base}.jpg`;
  try {
    await writeFile(inputPath, input.videoBuffer);
    await execFileAsync(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", "-sseof", "-0.12", "-i", inputPath, "-frames:v", "1", "-q:v", "2", outputPath], { timeout: 45_000, maxBuffer: 2 * 1024 * 1024 });
    const frame = await readFile(outputPath);
    if (!frame.length) throw new Error("empty_frame");
    const storagePath = `studio/projects/${input.projectId}/scenes/${input.sceneIndex}/continuity/${safeTask}-end-frame.jpg`;
    await (await getAdminStorage()).bucket().file(storagePath).save(frame, {
      resumable: false,
      contentType: "image/jpeg",
      metadata: {
        cacheControl: "private,max-age=31536000,immutable",
        metadata: { studioProjectId: input.projectId, studioSceneIndex: String(input.sceneIndex), providerTaskId: input.taskId, purpose: "continuity-end-frame" },
      },
    });
    return { continuityFrameStoragePath: storagePath, continuityFrameContentType: "image/jpeg", continuityFrameError: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "continuity_frame_extraction_failed";
    console.error("studio_continuity_frame_extraction_failed", { projectId: input.projectId, sceneIndex: input.sceneIndex, message });
    return { continuityFrameStoragePath: null, continuityFrameContentType: null, continuityFrameError: message.slice(0, 500) };
  } finally {
    await Promise.all([rm(inputPath, { force: true }).catch(() => undefined), rm(outputPath, { force: true }).catch(() => undefined)]);
  }
}

export async function ensureStudioContinuityFrame(input: { projectId: string; sceneIndex: number; taskId: string; storagePath: string; existingFrameStoragePath?: string | null }) {
  const bucket = (await getAdminStorage()).bucket();
  if (input.existingFrameStoragePath) {
    const [exists] = await bucket.file(input.existingFrameStoragePath).exists();
    if (exists) return { continuityFrameStoragePath: input.existingFrameStoragePath, continuityFrameContentType: "image/jpeg", continuityFrameError: null };
  }
  const source = bucket.file(input.storagePath);
  const [exists] = await source.exists();
  if (!exists) return { continuityFrameStoragePath: null, continuityFrameContentType: null, continuityFrameError: "studio_output_not_found" };
  const [videoBuffer] = await source.download();
  return extractContinuityFrame({ projectId: input.projectId, sceneIndex: input.sceneIndex, taskId: input.taskId, videoBuffer });
}

export async function archiveStudioOutput(input: { projectId: string; sceneIndex: number; provider: string; taskId: string; outputUrl: string }) {
  const response = await fetch(input.outputUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`studio_output_fetch_${response.status}`);

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get("content-type") || "video/mp4";
  const safeProvider = input.provider.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  const safeTask = input.taskId.replace(/[^a-z0-9_-]/gi, "-");
  const storagePath = `studio/projects/${input.projectId}/scenes/${input.sceneIndex}/${safeProvider}-${safeTask}.mp4`;

  const storage = await getAdminStorage();
  const bucket = storage.bucket();
  await bucket.file(storagePath).save(buffer, {
    resumable: false,
    contentType,
    metadata: {
      cacheControl: "private,max-age=31536000,immutable",
      metadata: {
        studioProjectId: input.projectId,
        studioSceneIndex: String(input.sceneIndex),
        provider: input.provider,
        providerTaskId: input.taskId,
      },
    },
  });

  const continuityFrame = await extractContinuityFrame({ projectId: input.projectId, sceneIndex: input.sceneIndex, taskId: input.taskId, videoBuffer: buffer });

  return {
    storagePath,
    contentType,
    sizeBytes: buffer.length,
    archivedAt: new Date().toISOString(),
    ...continuityFrame,
  } satisfies StudioArchivedOutput;
}

export async function readStudioArchivedOutput(storagePath: string) {
  const storage = await getAdminStorage();
  const file = storage.bucket().file(storagePath);
  const [exists] = await file.exists();
  if (!exists) throw new Error("studio_output_not_found");
  const [[buffer], [metadata]] = await Promise.all([file.download(), file.getMetadata()]);
  return {
    buffer,
    contentType: metadata.contentType || "video/mp4",
    sizeBytes: Number(metadata.size || buffer.length),
  };
}
