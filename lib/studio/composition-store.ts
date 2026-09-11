import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getStudioProject } from "@/lib/studio/project-store";

export type StudioBrandMode = "algenri" | "asset" | "text" | "none";
export type StudioCompositionPreset = "editorial" | "commercial" | "minimal";

export type StudioBrandConfig = {
  mode: StudioBrandMode;
  name: string;
  logoStoragePath?: string | null;
  logoContentType?: string | null;
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
  offsetX: number;
  offsetY: number;
  widthPercent: number;
  scalePercent: number;
  panelOpacity: number;
};

export type StudioComposition = {
  state: "draft" | "approved";
  brand: StudioBrandConfig;
  preset: StudioCompositionPreset;
  sceneOverlays: StudioSceneOverlay[];
  transition: "cut" | "fade";
  approvedAt: string | null;
  updatedAt: string;
};

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function brandForProject(project: any): StudioBrandConfig {
  if (project?.briefing?.useBrandIdentity === false) return { mode: "none", name: "" };
  const clientName = project?.commercialLink?.origin === "client" ? String(project?.commercialLink?.clientName || "").trim() : "";
  const asset = project?.brandAsset;
  if (asset?.storagePath) return { mode: "asset", name: clientName || String(project?.name || "Marca"), logoStoragePath: asset.storagePath, logoContentType: asset.contentType || null };
  if (clientName) return { mode: "text", name: clientName.slice(0, 80) };
  return { mode: "algenri", name: "ALGENRI" };
}

function normalizeOverlay(item: Partial<StudioSceneOverlay> & { sceneIndex: number }, brandMode: StudioBrandMode): StudioSceneOverlay {
  return {
    sceneIndex: Number(item.sceneIndex),
    enabled: item.enabled !== false,
    eyebrow: String(item.eyebrow ?? "").slice(0, 80),
    headline: String(item.headline ?? "").slice(0, 160),
    body: String(item.body ?? "").slice(0, 280),
    cta: String(item.cta ?? "").slice(0, 100),
    align: item.align === "center" || item.align === "right" ? item.align : "left",
    position: item.position === "top" || item.position === "bottom" ? item.position : "center",
    showBrand: brandMode !== "none" && item.showBrand !== false,
    offsetX: clamp(item.offsetX, -28, 28, 0),
    offsetY: clamp(item.offsetY, -28, 28, 0),
    widthPercent: clamp(item.widthPercent, 36, 92, 84),
    scalePercent: clamp(item.scalePercent, 65, 135, 100),
    panelOpacity: clamp(item.panelOpacity, 18, 80, 58),
  };
}

function defaultsForProject(project: any, brand = brandForProject(project)): StudioSceneOverlay[] {
  const scenes = Array.isArray(project?.storyboard) ? project.storyboard : [];
  return scenes.map((scene: any, index: number) => normalizeOverlay({
    sceneIndex: Number(scene.index), enabled: true, eyebrow: "", headline: String(scene.title ?? ""), body: "",
    cta: index === scenes.length - 1 && brand.name ? `Conheça ${brand.name}` : "",
    align: "left", position: index === scenes.length - 1 ? "bottom" : "center", showBrand: brand.mode !== "none",
    offsetX: 0, offsetY: 0, widthPercent: 84, scalePercent: 100, panelOpacity: 58,
  }, brand.mode));
}

export async function getStudioComposition(projectId: string): Promise<StudioComposition> {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");
  const stored = project.composition as StudioComposition | undefined;
  const fallbackBrand = brandForProject(project);
  if (stored?.sceneOverlays?.length) {
    const brand = stored.brand ?? fallbackBrand;
    return {
      ...stored,
      brand,
      preset: stored.preset ?? "editorial",
      sceneOverlays: stored.sceneOverlays.map((item) => normalizeOverlay(item, brand.mode)),
    };
  }
  return { state: "draft", brand: fallbackBrand, preset: "editorial", sceneOverlays: defaultsForProject(project, fallbackBrand), transition: "fade", approvedAt: null, updatedAt: new Date().toISOString() };
}

export async function saveStudioComposition(projectId: string, input: { brand?: StudioBrandConfig; preset?: StudioCompositionPreset; sceneOverlays: StudioSceneOverlay[]; transition: "cut" | "fade"; approve?: boolean }) {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");
  const storyboardIndices = new Set((Array.isArray(project.storyboard) ? project.storyboard : []).map((scene: any) => Number(scene.index)));
  const brandFallback = brandForProject(project);
  const brandInput = input.brand ?? brandFallback;
  let mode: StudioBrandMode = ["algenri", "asset", "text", "none"].includes(brandInput.mode) ? brandInput.mode : "none";
  const brand: StudioBrandConfig = {
    mode,
    name: String(brandInput.name ?? "").trim().slice(0, 80),
    logoStoragePath: mode === "asset" ? String(brandInput.logoStoragePath || project?.brandAsset?.storagePath || "") || null : null,
    logoContentType: mode === "asset" ? String(brandInput.logoContentType || project?.brandAsset?.contentType || "") || null : null,
  };
  if (brand.mode === "algenri" && !brand.name) brand.name = "ALGENRI";
  if (brand.mode === "text" && !brand.name) brand.mode = "none";
  if (brand.mode === "asset" && !brand.logoStoragePath) brand.mode = brand.name ? "text" : "none";

  const overlays = input.sceneOverlays
    .filter((item) => storyboardIndices.has(Number(item.sceneIndex)))
    .map((item) => normalizeOverlay(item, brand.mode));
  const now = new Date().toISOString();
  const composition: StudioComposition = {
    state: input.approve ? "approved" : "draft",
    brand,
    preset: input.preset === "commercial" || input.preset === "minimal" ? input.preset : "editorial",
    sceneOverlays: overlays,
    transition: input.transition === "cut" ? "cut" : "fade",
    approvedAt: input.approve ? now : null,
    updatedAt: now,
  };
  const db = await getAdminDb();
  await db.collection("studioProjects").doc(projectId).set({ composition, finalRender: null, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return composition;
}
