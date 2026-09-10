import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getStudioProject } from "@/lib/studio/project-store";
import { prepareStudioFinalRender } from "@/lib/studio/final-render";

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { projectId } = await context.params;
    const project = await getStudioProject(projectId);
    if (!project) return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    if (project.ownerUid && project.ownerUid !== user.uid) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

    const manifest = await prepareStudioFinalRender(projectId);
    return Response.json({ ok: true, manifest });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    console.error("studio_final_render_prepare_failed", error);
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "studio_final_render_prepare_failed",
    }, { status: 409 });
  }
}
