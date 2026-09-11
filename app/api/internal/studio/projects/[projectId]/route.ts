import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { getStudioProject } from "@/lib/studio/project-store";

async function authorize(request: Request, projectId: string) {
  const user = await requireAlgenriInternalUser(request);
  const project = await getStudioProject(projectId);
  if (!project) return { ok: false as const, response: Response.json({ ok: false, error: "not_found" }, { status: 404 }) };
  if (project.ownerUid && project.ownerUid !== user.uid) {
    return { ok: false as const, response: Response.json({ ok: false, error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, project };
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
