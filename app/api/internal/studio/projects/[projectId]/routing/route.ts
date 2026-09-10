import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getStudioProject } from "@/lib/studio/project-store";
import { buildStudioRoutingPlan } from "@/lib/studio/routing-planner";

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { projectId } = await context.params;
    const project = await getStudioProject(projectId);
    if (!project) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    if (project.ownerUid && project.ownerUid !== user.uid) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

    const routing = await buildStudioRoutingPlan(projectId);
    return Response.json({ ok: true, routing });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    const code = error instanceof Error ? error.message : "studio_routing_failed";
    const status = code === "studio_storyboard_not_approved" ? 409 : code === "studio_project_not_found" ? 404 : 500;
    console.error("studio_routing_failed", error);
    return Response.json({ ok: false, error: code }, { status });
  }
}
