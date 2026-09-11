import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getStudioProject } from "@/lib/studio/project-store";
import { buildStudioPreflightReport } from "@/lib/studio/preflight";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { projectId } = await context.params;
    const project = await getStudioProject(projectId);
    if (!project) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    if (project.ownerUid && project.ownerUid !== user.uid) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
    return Response.json({ ok: true, report: await buildStudioPreflightReport(projectId) });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    console.error("studio_preflight_failed", error);
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "studio_preflight_failed" }, { status: 500 });
  }
}
