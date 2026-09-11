import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getStudioProject } from "@/lib/studio/project-store";

export type StudioContinuityMode = "independent" | "coherent" | "strict";
export type StudioContinuityConfig = {
  mode: StudioContinuityMode;
  characters: string;
  environment: string;
  wardrobe: string;
  visualRules: string;
  referenceImageStoragePath?: string | null;
  referenceImageContentType?: string | null;
  updatedAt: string;
};

export function normalizeStudioContinuity(value: any): StudioContinuityConfig {
  const mode: StudioContinuityMode = value?.mode === "independent" || value?.mode === "strict" ? value.mode : "coherent";
  return {
    mode,
    characters: String(value?.characters ?? "").slice(0, 1800),
    environment: String(value?.environment ?? "").slice(0, 1800),
    wardrobe: String(value?.wardrobe ?? "").slice(0, 1200),
    visualRules: String(value?.visualRules ?? "").slice(0, 1800),
    referenceImageStoragePath: value?.referenceImageStoragePath ? String(value.referenceImageStoragePath).slice(0, 500) : null,
    referenceImageContentType: value?.referenceImageContentType ? String(value.referenceImageContentType).slice(0, 120) : null,
    updatedAt: String(value?.updatedAt || new Date().toISOString()),
  };
}

export async function getStudioContinuity(projectId: string) {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");
  return normalizeStudioContinuity(project.continuity);
}

export async function saveStudioContinuity(projectId: string, patch: Partial<StudioContinuityConfig>) {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");
  const current = normalizeStudioContinuity(project.continuity);
  const continuity = normalizeStudioContinuity({ ...current, ...patch, updatedAt: new Date().toISOString() });
  await (await getAdminDb()).collection("studioProjects").doc(projectId).set({
    continuity,
    routing: { state: "not_started", generatedAt: null, routes: [], totalEstimatedCredits: null, fullyExecutable: false, providerCoverage: null },
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return continuity;
}
