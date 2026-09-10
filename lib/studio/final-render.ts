import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getStudioProject, type StudioSceneGenerationJob } from "@/lib/studio/project-store";
import type { StudioComposition, StudioSceneOverlay } from "@/lib/studio/composition-store";

export type StudioFinalRenderScene = {
  sceneIndex: number;
  version: number;
  provider: string;
  model: string | null;
  storagePath: string;
  durationSeconds: number;
  overlay: StudioSceneOverlay;
};

export type StudioFinalRenderManifest = {
  state: "prepared" | "rendering" | "completed" | "failed";
  format: "mp4";
  aspectRatio: "16:9" | "9:16" | "1:1";
  transition: "cut" | "fade";
  scenes: StudioFinalRenderScene[];
  totalDurationSeconds: number;
  preparedAt: string;
  renderEngine: "pending" | "ffmpeg-static";
  startedAt?: string | null;
  completedAt?: string | null;
  outputStoragePath: string | null;
  outputUrl: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  error: string | null;
};

function normalizeAspectRatio(value: unknown): "16:9" | "9:16" | "1:1" {
  if (value === "1:1") return "1:1";
  if (value === "9:16" || value === "4:5") return "9:16";
  return "16:9";
}

export async function prepareStudioFinalRender(projectId: string): Promise<StudioFinalRenderManifest> {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");

  const composition = project.composition as StudioComposition | undefined;
  if (!composition || composition.state !== "approved") throw new Error("studio_composition_not_approved");

  const storyboard = Array.isArray(project.storyboard) ? project.storyboard : [];
  const activeJobs = Array.isArray(project.generation?.sceneJobs) ? project.generation.sceneJobs as StudioSceneGenerationJob[] : [];
  const overlayByScene = new Map(composition.sceneOverlays.map((item) => [item.sceneIndex, item]));

  const scenes: StudioFinalRenderScene[] = storyboard.map((scene: any) => {
    const job = activeJobs.find((item) => item.sceneIndex === Number(scene.index) && item.status === "succeeded");
    if (!job) throw new Error(`studio_scene_${scene.index}_not_ready`);
    if (!job.storagePath) throw new Error(`studio_scene_${scene.index}_not_archived`);
    const overlay = overlayByScene.get(Number(scene.index));
    if (!overlay) throw new Error(`studio_scene_${scene.index}_overlay_missing`);
    return {
      sceneIndex: Number(scene.index),
      version: job.version ?? 1,
      provider: job.provider,
      model: job.model ?? null,
      storagePath: job.storagePath,
      durationSeconds: Math.max(1, Math.round(Number(scene.durationSeconds ?? 1))),
      overlay,
    };
  });

  const preparedAt = new Date().toISOString();
  const manifest: StudioFinalRenderManifest = {
    state: "prepared",
    format: "mp4",
    aspectRatio: normalizeAspectRatio(project.briefing?.aspectRatio),
    transition: composition.transition,
    scenes,
    totalDurationSeconds: scenes.reduce((sum, item) => sum + item.durationSeconds, 0),
    preparedAt,
    renderEngine: "pending",
    startedAt: null,
    completedAt: null,
    outputStoragePath: null,
    outputUrl: null,
    contentType: null,
    sizeBytes: null,
    error: null,
  };

  const db = await getAdminDb();
  await db.collection("studioProjects").doc(projectId).set({
    finalRender: manifest,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return manifest;
}
