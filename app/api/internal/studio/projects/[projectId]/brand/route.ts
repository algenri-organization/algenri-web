import { FieldValue } from "firebase-admin/firestore";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { getStudioProject } from "@/lib/studio/project-store";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([["image/png", "png"], ["image/jpeg", "jpg"], ["image/webp", "webp"]]);

async function authorize(request: Request, projectId: string) {
  const user = await requireAlgenriInternalUser(request);
  const project = await getStudioProject(projectId);
  if (!project) return { response: Response.json({ ok: false, error: "not_found" }, { status: 404 }) };
  if (project.ownerUid && project.ownerUid !== user.uid) return { response: Response.json({ ok: false, error: "forbidden" }, { status: 403 }) };
  return { project };
}

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const auth = await authorize(request, projectId); if (auth.response) return auth.response;
    const asset = auth.project?.brandAsset;
    if (!asset?.storagePath) return Response.json({ ok: false, error: "brand_asset_not_found" }, { status: 404 });
    const [buffer] = await (await getAdminStorage()).bucket().file(asset.storagePath).download();
    return new Response(buffer, { headers: { "Content-Type": asset.contentType || "image/png", "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    const auth = internalAuthResponse(error); if (auth) return auth;
    return Response.json({ ok: false, error: "brand_asset_load_failed" }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const auth = await authorize(request, projectId); if (auth.response) return auth.response;
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ ok: false, error: "brand_file_required" }, { status: 400 });
    const ext = ALLOWED.get(file.type);
    if (!ext) return Response.json({ ok: false, error: "brand_file_type_invalid" }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_BYTES) return Response.json({ ok: false, error: "brand_file_size_invalid" }, { status: 400 });

    const storagePath = `studio/projects/${projectId}/brand/logo.${ext}`;
    const bucket = (await getAdminStorage()).bucket();
    await bucket.deleteFiles({ prefix: `studio/projects/${projectId}/brand/` }).catch(() => undefined);
    await bucket.file(storagePath).save(Buffer.from(await file.arrayBuffer()), { resumable: false, metadata: { contentType: file.type, cacheControl: "private,max-age=300" } });

    const project = auth.project!;
    const name = String(project.commercialLink?.clientName || project.name || "Marca").slice(0, 80);
    const brandAsset = { storagePath, contentType: file.type, sizeBytes: file.size, originalName: file.name.slice(0, 160), uploadedAt: new Date().toISOString() };
    const existingComposition = project.composition ?? null;
    const composition = existingComposition ? { ...existingComposition, state: "draft", approvedAt: null, brand: { mode: "asset", name, logoStoragePath: storagePath, logoContentType: file.type }, updatedAt: new Date().toISOString() } : existingComposition;
    await (await getAdminDb()).collection("studioProjects").doc(projectId).set({ brandAsset, ...(composition ? { composition } : {}), finalRender: null, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return Response.json({ ok: true, brand: { mode: "asset", name, logoStoragePath: storagePath, logoContentType: file.type }, previewUrl: `/api/internal/studio/projects/${projectId}/brand` });
  } catch (error) {
    const auth = internalAuthResponse(error); if (auth) return auth;
    console.error("studio_brand_upload_failed", error);
    return Response.json({ ok: false, error: "studio_brand_upload_failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const auth = await authorize(request, projectId); if (auth.response) return auth.response;
    const project = auth.project!;
    await (await getAdminStorage()).bucket().deleteFiles({ prefix: `studio/projects/${projectId}/brand/` }).catch(() => undefined);
    const clientName = project.commercialLink?.origin === "client" ? String(project.commercialLink?.clientName || "").trim() : "";
    const brand = clientName ? { mode: "text", name: clientName } : { mode: "algenri", name: "ALGENRI" };
    const existingComposition = project.composition ?? null;
    const composition = existingComposition ? { ...existingComposition, state: "draft", approvedAt: null, brand, updatedAt: new Date().toISOString() } : existingComposition;
    await (await getAdminDb()).collection("studioProjects").doc(projectId).set({ brandAsset: FieldValue.delete(), ...(composition ? { composition } : {}), finalRender: null, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return Response.json({ ok: true, brand });
  } catch (error) {
    const auth = internalAuthResponse(error); if (auth) return auth;
    return Response.json({ ok: false, error: "studio_brand_delete_failed" }, { status: 500 });
  }
}
