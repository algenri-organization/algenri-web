import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getStudioProject } from "@/lib/studio/project-store";

export type StudioBrandMode = "algenri" | "text" | "none";

export type StudioBrandConfig = {
  mode: StudioBrandMode;
  name: string;
};

export type StudioSceneOverlay = {
  sceneIndex: number;
  enabled: boolean;
  eyebrow: string;
  headline: string;
  body: string;
  cta: string;
  align: "left" | "center" | "right";
  position: "top" | "center" | "bottom";
  showBrand: boolean;
};

export type StudioComposition = {
  state: "draft" | "approved";
  brand: StudioBrandConfig;
  sceneOverlays: StudioSceneOverlay[];
  transition: "cut" | "fade";
  approvedAt: string | null;
  updatedAt: string;
};

function brandForProject(project: any): StudioBrandConfig {
  const useBrandIdentity = project?.briefing?.useBrandIdentity !== false;
  if (!useBrandIdentity) return { mode: "none", name: "" };
  const clientName = project?.commercialLink?.origin === "client"
    ? String(project?.commercialLink?.clientName || "").trim()
    : "";
  if (clientName) return { mode: "text", name: clientName.slice(0, 80) };
  return { mode: "algenri", name: "ALGENRI" };
}

function defaultsForProject(project: any, brand = brandForProject(project)): StudioSceneOverlay[] {
  const scenes = Array.isArray(project?.storyboard) ? project.storyboard : [];
  return scenes.map((scene: any, index: number) => ({
    sceneIndex: Number(scene.index),
    enabled: true,
    eyebrow: "",
    headline: String(scene.title ?? ""),
    body: "",
    cta: index === scenes.length - 1 && brand.name ? `Conheça ${brand.name}` : "",
    align: "left" as const,
    position: index === scenes.length - 1 ? "bottom" as const : "center" as const,
    showBrand: brand.mode !== "none",
  }));
}

export async function getStudioComposition(projectId: string): Promise<StudioComposition> {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");
  const stored = project.composition as StudioComposition | undefined;
  const fallbackBrand = brandForProject(project);
  if (stored?.sceneOverlays?.length) {
    return {
      ...stored,
      brand: stored.brand ?? fallbackBrand,
    };
  }
  return {
    state: "draft",
    brand: fallbackBrand,
    sceneOverlays: defaultsForProject(project, fallbackBrand),
    transition: "fade",
    approvedAt: null,
    updatedAt: new Date().toISOString(),
  };
}

export async function saveStudioComposition(projectId: string, input: { brand?: StudioBrandConfig; sceneOverlays: StudioSceneOverlay[]; transition: "cut" | "fade"; approve?: boolean }) {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");
  const storyboardIndices = new Set((Array.isArray(project.storyboard) ? project.storyboard : []).map((scene: any) => Number(scene.index)));
  const brandFallback = brandForProject(project);
  const brandInput = input.brand ?? brandFallback;
  const brand: StudioBrandConfig = {
    mode: brandInput.mode === "algenri" || brandInput.mode === "text" ? brandInput.mode : "none",
    name: String(brandInput.name ?? "").trim().slice(0, 80),
  };
  if (brand.mode === "algenri" && !brand.name) brand.name = "ALGENRI";
  if (brand.mode === "text" && !brand.name) brand.mode = "none";

  const overlays: StudioSceneOverlay[] = input.sceneOverlays
    .filter((item) => storyboardIndices.has(Number(item.sceneIndex)))
    .map((item): StudioSceneOverlay => ({
      sceneIndex: Number(item.sceneIndex),
      enabled: Boolean(item.enabled),
      eyebrow: String(item.eyebrow ?? "").slice(0, 80),
      headline: String(item.headline ?? "").slice(0, 160),
      body: String(item.body ?? "").slice(0, 280),
      cta: String(item.cta ?? "").slice(0, 100),
      align: item.align === "center" || item.align === "right" ? item.align : "left",
      position: item.position === "top" || item.position === "bottom" ? item.position : "center",
      showBrand: brand.mode !== "none" && Boolean(item.showBrand),
    }));
  const now = new Date().toISOString();
  const composition: StudioComposition = {
    state: input.approve ? "approved" : "draft",
    brand,
    sceneOverlays: overlays,
    transition: input.transition === "cut" ? "cut" : "fade",
    approvedAt: input.approve ? now : null,
    updatedAt: now,
  };
  const db = await getAdminDb();
  await db.collection("studioProjects").doc(projectId).set({
    composition,
    finalRender: null,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return composition;
}
