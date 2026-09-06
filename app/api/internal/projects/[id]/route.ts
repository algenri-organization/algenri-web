import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getClient, getProject, updateProject } from "@/lib/client-flow/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAlgenriInternalUser(request);
    const { id } = await context.params;
    const project = await getProject(id);
    if (!project) return Response.json({ ok: false, error: "project_not_found" }, { status: 404 });
    return Response.json({ ok: true, project, client: await getClient(project.clientId) });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    console.error("Project detail failed", error);
    return Response.json({ ok: false, error: "project_detail_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAlgenriInternalUser(request);
    const { id } = await context.params;
    const project = await updateProject(id, await request.json());
    if (!project) return Response.json({ ok: false, error: "project_not_found" }, { status: 404 });
    return Response.json({ ok: true, project });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    console.error("Project update failed", error);
    return Response.json({ ok: false, error: "project_update_failed" }, { status: 500 });
  }
}
