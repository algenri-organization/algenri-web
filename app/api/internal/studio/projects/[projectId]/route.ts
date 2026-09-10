import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getStudioProject } from "@/lib/studio/project-store";

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { projectId } = await context.params;
    const project = await getStudioProject(projectId);
    if (!project) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    if (project.ownerUid && project.ownerUid !== user.uid) {
      return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
    return Response.json({ ok: true, project });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    console.error("studio_project_load_failed", error);
    return Response.json({ ok: false, error: "studio_project_load_failed" }, { status: 500 });
  }
}
