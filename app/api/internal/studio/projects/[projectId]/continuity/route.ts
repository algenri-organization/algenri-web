import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { getStudioContinuity, saveStudioContinuity } from "@/lib/studio/continuity-store";
import { getStudioProject } from "@/lib/studio/project-store";

const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED = new Map([["image/png", "png"], ["image/jpeg", "jpg"], ["image/webp", "webp"]]);
const patchSchema = z.object({
  mode: z.enum(["independent", "coherent", "strict"]),
  characters: z.string().max(1800),
  environment: z.string().max(1800),
  wardrobe: z.string().max(1200),
  visualRules: z.string().max(1800),
});

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
    const url = new URL(request.url);
    const continuity = await getStudioContinuity(projectId);
    if (url.searchParams.get("asset") === "1") {
      if (!continuity.referenceImageStoragePath) return Response.json({ ok: false, error: "continuity_reference_not_found" }, { status: 404 });
      const [buffer] = await (await getAdminStorage()).bucket().file(continuity.referenceImageStoragePath).download();
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
      return new Response(arrayBuffer, { headers: { "Content-Type": continuity.referenceImageContentType || "image/png", "Cache-Control": "private, max-age=300" } });
    }
    return Response.json({ ok: true, continuity, referencePreviewUrl: continuity.referenceImageStoragePath ? `/api/internal/studio/projects/${projectId}/continuity?asset=1` : null });
  } catch (error) {
    const auth = internalAuthResponse(error); if (auth) return auth;
    return Response.json({ ok: false, error: "studio_continuity_load_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const auth = await authorize(request, projectId); if (auth.response) return auth.response;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ ok: false, error: "invalid_request", issues: parsed.error.issues }, { status: 400 });
    return Response.json({ ok: true, continuity: await saveStudioContinuity(projectId, parsed.data) });
  } catch (error) {
    const auth = internalAuthResponse(error); if (auth) return auth;
    return Response.json({ ok: false, error: "studio_continuity_save_failed" }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const auth = await authorize(request, projectId); if (auth.response) return auth.response;
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ ok: false, error: "continuity_reference_required" }, { status: 400 });
    const ext = ALLOWED.get(file.type);
    if (!ext) return Response.json({ ok: false, error: "continuity_reference_type_invalid" }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_BYTES) return Response.json({ ok: false, error: "continuity_reference_size_invalid" }, { status: 400 });
    const storagePath = `studio/projects/${projectId}/continuity/reference.${ext}`;
    const bucket = (await getAdminStorage()).bucket();
    await bucket.deleteFiles({ prefix: `studio/projects/${projectId}/continuity/` }).catch(() => undefined);
    await bucket.file(storagePath).save(Buffer.from(await file.arrayBuffer()), { resumable: false, metadata: { contentType: file.type, cacheControl: "private,max-age=300" } });
    const continuity = await saveStudioContinuity(projectId, { referenceImageStoragePath: storagePath, referenceImageContentType: file.type });
    return Response.json({ ok: true, continuity, referencePreviewUrl: `/api/internal/studio/projects/${projectId}/continuity?asset=1` });
  } catch (error) {
    const auth = internalAuthResponse(error); if (auth) return auth;
    console.error("studio_continuity_reference_upload_failed", error);
    return Response.json({ ok: false, error: "studio_continuity_reference_upload_failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const auth = await authorize(request, projectId); if (auth.response) return auth.response;
    await (await getAdminStorage()).bucket().deleteFiles({ prefix: `studio/projects/${projectId}/continuity/` }).catch(() => undefined);
    const continuity = await saveStudioContinuity(projectId, { referenceImageStoragePath: null, referenceImageContentType: null });
    await (await getAdminDb()).collection("studioProjects").doc(projectId).set({ updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return Response.json({ ok: true, continuity });
  } catch (error) {
    const auth = internalAuthResponse(error); if (auth) return auth;
    return Response.json({ ok: false, error: "studio_continuity_reference_delete_failed" }, { status: 500 });
  }
}
