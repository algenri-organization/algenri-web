import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getStudioProject, type StudioSceneGenerationJob } from "@/lib/studio/project-store";
import type { StudioBrandConfig, StudioComposition, StudioSceneOverlay } from "@/lib/studio/composition-store";

export type StudioFinalRenderScene = {
  sceneIndex: number;
  version: number;
  provider: string;
  model: string | null;
  storagePath: string;
  durationSeconds: number;
  overlay: StudioSceneOverlay;
};

export type StudioFinalRenderWorker = {
  provider: "vercel-sandbox";
  sandboxName: string;
  commandId: string;
  statusStoragePath: string;
  startedAt: string;
  finishedAt?: string | null;
  exitCode?: string | null;
};

export type StudioFinalRenderManifest = {
  state: "prepared" | "rendering" | "completed" | "failed";
  format: "mp4";
  aspectRatio: "16:9" | "9:16" | "1:1";
  transition: "cut" | "fade";
  brand: StudioBrandConfig;
  scenes: StudioFinalRenderScene[];
  totalDurationSeconds: number;
  preparedAt: string;
  renderEngine: "pending" | "ffmpeg-static" | "vercel-sandbox";
  startedAt?: string | null;
  completedAt?: string | null;
  outputStoragePath: string | null;
  outputUrl: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  error: string | null;
  worker?: StudioFinalRenderWorker | null;
};

function normalizeAspectRatio(value: unknown): "16:9" | "9:16" | "1:1" {
  if (value === "1:1") return "1:1";
  if (value === "9:16" || value === "4:5") return "9:16";
  return "16:9";
}

function resolveBrand(project: Record<string, any>, composition: StudioComposition): StudioBrandConfig {
  if (composition.brand) return composition.brand;
  if (project.briefing?.useBrandIdentity === false) return { mode: "none", name: "" };
  const clientName = project.commercialLink?.origin === "client" ? String(project.commercialLink?.clientName || "").trim() : "";
  return clientName ? { mode: "text", name: clientName.slice(0, 80) } : { mode: "algenri", name: "ALGENRI" };
}

function resolveActiveSceneJob(project: Record<string, any>, sceneIndex: number): StudioSceneGenerationJob | null {
  const history = Array.isArray(project.generation?.sceneVersions)
    ? project.generation.sceneVersions as StudioSceneGenerationJob[]
    : [];
  const activeJobs = Array.isArray(project.generation?.sceneJobs)
    ? project.generation.sceneJobs as StudioSceneGenerationJob[]
    : [];
  const activeVersionRaw = project.generation?.activeVersionByScene?.[String(sceneIndex)];
  const activeVersion = Number(activeVersionRaw);

  if (Number.isFinite(activeVersion) && activeVersion > 0) {
    const selected = history.find((item) =>
      item.sceneIndex === sceneIndex &&
      Number(item.version ?? 1) === activeVersion &&
      item.status === "succeeded"
    );
    if (selected) return selected;
    throw new Error(`studio_scene_${sceneIndex}_active_version_not_ready`);
  }

  const current = activeJobs.find((item) => item.sceneIndex === sceneIndex && item.status === "succeeded");
  if (current) return current;

  const latestSucceeded = history
    .filter((item) => item.sceneIndex === sceneIndex && item.status === "succeeded")
    .sort((a, b) => Number(b.version ?? 1) - Number(a.version ?? 1))[0];
  return latestSucceeded ?? null;
}

export async function prepareStudioFinalRender(projectId: string): Promise<StudioFinalRenderManifest> {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");

  const composition = project.composition as StudioComposition | undefined;
  if (!composition || composition.state !== "approved") throw new Error("studio_composition_not_approved");

  const storyboard = Array.isArray(project.storyboard) ? project.storyboard : [];
  if (!storyboard.length) throw new Error("studio_storyboard_empty");

  const overlayByScene = new Map(composition.sceneOverlays.map((item) => [item.sceneIndex, item]));
  const seen = new Set<number>();

  const scenes: StudioFinalRenderScene[] = storyboard
    .map((scene: any) => {
      const sceneIndex = Number(scene.index);
      if (!Number.isFinite(sceneIndex) || sceneIndex <= 0) throw new Error("studio_scene_index_invalid");
      if (seen.has(sceneIndex)) throw new Error(`studio_scene_${sceneIndex}_duplicated`);
      seen.add(sceneIndex);

      const job = resolveActiveSceneJob(project, sceneIndex);
      if (!job) throw new Error(`studio_scene_${sceneIndex}_not_ready`);
      if (!job.storagePath) throw new Error(`studio_scene_${sceneIndex}_not_archived`);
      const overlay = overlayByScene.get(sceneIndex);
      if (!overlay) throw new Error(`studio_scene_${sceneIndex}_overlay_missing`);

      return {
        sceneIndex,
        version: Number(job.version ?? 1),
        provider: job.provider,
        model: job.model ?? null,
        storagePath: job.storagePath,
        durationSeconds: Math.max(1, Math.round(Number(scene.durationSeconds ?? 1))),
        overlay,
      };
    })
    .sort((a, b) => a.sceneIndex - b.sceneIndex);

  if (scenes.length !== storyboard.length) throw new Error("studio_final_render_scene_count_mismatch");

  const totalDurationSeconds = scenes.reduce((sum, item) => sum + item.durationSeconds, 0);
  if (totalDurationSeconds <= 0) throw new Error("studio_final_render_duration_invalid");

  const preparedAt = new Date().toISOString();
  const manifest: StudioFinalRenderManifest = {
    state: "prepared",
    format: "mp4",
    aspectRatio: normalizeAspectRatio(project.briefing?.aspectRatio),
    transition: composition.transition,
    brand: resolveBrand(project, composition),
    scenes,
    totalDurationSeconds,
    preparedAt,
    renderEngine: "pending",
    startedAt: null,
    completedAt: null,
    outputStoragePath: null,
    outputUrl: null,
    contentType: null,
    sizeBytes: null,
    error: null,
    worker: null,
  };

  const db = await getAdminDb();
  await db.collection("studioProjects").doc(projectId).set({
    finalRender: manifest,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return manifest;
}
