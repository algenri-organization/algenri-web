import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { getStudioProject } from "@/lib/studio/project-store";

const renameSchema = z.object({ name: z.string().trim().min(2).max(180) });
const duplicateSchema = z.object({ action: z.literal("duplicate_template"), name: z.string().trim().min(2).max(180).optional() });

async function authorize(request: Request, projectId: string) {
  const user = await requireAlgenriInternalUser(request);
  const project = await getStudioProject(projectId);
  if (!project) return { ok: false as const, response: Response.json({ ok: false, error: "not_found" }, { status: 404 }) };
  if (project.ownerUid && project.ownerUid !== user.uid) {
    return { ok: false as const, response: Response.json({ ok: false, error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, project, user };
}

async function copyAsset(bucket: any, sourcePath: unknown, projectId: string, folder: string) {
  if (typeof sourcePath !== "string" || !sourcePath.trim()) return null;
  const source = bucket.file(sourcePath);
  const [exists] = await source.exists();
  if (!exists) return null;
  const filename = sourcePath.split("/").pop() || "asset";
  const targetPath = `studio/projects/${projectId}/${folder}/${filename}`;
  await source.copy(bucket.file(targetPath));
  return targetPath;
}

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const auth = await authorize(request, projectId);
    if (!auth.ok) return auth.response;
    return Response.json({ ok: true, project: auth.project });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    console.error("studio_project_load_failed", error);
    return Response.json({ ok: false, error: "studio_project_load_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const auth = await authorize(request, projectId);
    if (!auth.ok) return auth.response;
    const parsed = renameSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return Response.json({ ok: false, error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
    const db = await getAdminDb();
    await db.collection("studioProjects").doc(projectId).set({ name: parsed.data.name, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return Response.json({ ok: true, projectId, name: parsed.data.name });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    console.error("studio_project_rename_failed", error);
    return Response.json({ ok: false, error: "studio_project_rename_failed" }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const auth = await authorize(request, projectId);
    if (!auth.ok) return auth.response;
    const parsed = duplicateSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return Response.json({ ok: false, error: "invalid_request", issues: parsed.error.issues }, { status: 400 });

    const project = auth.project as Record<string, any>;
    const db = await getAdminDb();
    const ref = db.collection("studioProjects").doc();
    const storage = await getAdminStorage();
    const bucket = storage.bucket();
    const newId = ref.id;
    try {
      const brandPath = await copyAsset(bucket, project.brandAsset?.storagePath, newId, "brand");
      const referencePath = await copyAsset(bucket, project.continuity?.referenceImageStoragePath, newId, "continuity");
      const storyboard = (Array.isArray(project.storyboard) ? project.storyboard : []).map((scene: any) => ({ ...scene, status: "draft" }));
      const brandAsset = brandPath ? { ...(project.brandAsset ?? {}), storagePath: brandPath, uploadedAt: new Date().toISOString() } : null;
      const brand = project.composition?.brand ? { ...project.composition.brand } : null;
      if (brand?.mode === "asset") {
        if (brandPath) brand.logoStoragePath = brandPath;
        else {
          brand.mode = brand.name ? "text" : "none";
          brand.logoStoragePath = null;
          brand.logoContentType = null;
        }
      }
      const composition = project.composition ? {
        ...project.composition,
        state: "draft",
        approvedAt: null,
        updatedAt: new Date().toISOString(),
        ...(brand ? { brand } : {}),
      } : null;
      const continuity = project.continuity ? {
        ...project.continuity,
        referenceImageStoragePath: referencePath,
        referenceImageContentType: referencePath ? project.continuity?.referenceImageContentType ?? null : null,
        updatedAt: new Date().toISOString(),
      } : null;
      const visualBible = project.visualBible ? { ...project.visualBible, updatedAt: new Date().toISOString() } : null;

      await ref.set({
        name: parsed.data.name || `${String(project.name || "Projeto Studio")} · Modelo`,
        format: project.format || "video",
        status: "planning",
        ownerUid: auth.user.uid,
        ownerEmail: auth.user.email ?? null,
        commercialLink: project.commercialLink ?? { origin: "internal" },
        briefing: project.briefing ?? {},
        storyboard,
        ai: { storyboardState: "copied", model: project.ai?.model ?? null, generatedAt: null, error: null },
        review: { approvedScenes: 0, totalScenes: storyboard.length, allApproved: false, approvedAt: null },
        continuity,
        visualBible,
        routing: { state: "not_started", generatedAt: null, routes: [], totalEstimatedCredits: null, fullyExecutable: false, providerCoverage: null },
        generation: { state: "not_started", estimatedCredits: null, actualCredits: null, provider: null, jobId: null, outputUrl: null, sceneJobs: [], sceneVersions: [], activeVersionByScene: {} },
        assets: [],
        benchmark: { enabled: true, qualityScore: null, promptAdherenceScore: null, notes: null },
        composition,
        ...(brandAsset ? { brandAsset } : {}),
        duplicatedFromProjectId: projectId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return Response.json({ ok: true, projectId: newId, name: parsed.data.name || `${String(project.name || "Projeto Studio")} · Modelo` }, { status: 201 });
    } catch (error) {
      await bucket.deleteFiles({ prefix: `studio/projects/${newId}/`, force: true }).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    console.error("studio_project_duplicate_failed", error);
    return Response.json({ ok: false, error: "studio_project_duplicate_failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const auth = await authorize(request, projectId);
    if (!auth.ok) return auth.response;

    const storage = await getAdminStorage();
    const bucket = storage.bucket();
    await bucket.deleteFiles({ prefix: `studio/projects/${projectId}/`, force: true }).catch((error) => {
      console.warn("studio_project_storage_delete_failed", projectId, error);
    });

    const db = await getAdminDb();
    await db.collection("studioProjects").doc(projectId).delete();
    return Response.json({ ok: true, deletedProjectId: projectId });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    console.error("studio_project_delete_failed", error);
    return Response.json({ ok: false, error: "studio_project_delete_failed" }, { status: 500 });
  }
}
