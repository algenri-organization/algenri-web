import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { linkBriefingInstanceToProject, unlinkBriefingInstanceFromProject } from "@/lib/briefing/instance-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { id } = await context.params;
    const body = await request.json();
    const clientId = String(body.clientId ?? "").trim();
    const projectId = String(body.projectId ?? "").trim();
    if (!clientId || !projectId) return Response.json({ ok: false, error: "missing_fields" }, { status: 400 });
    const instance = await linkBriefingInstanceToProject(id, clientId, projectId, user.email ?? user.uid);
    return Response.json({ ok: true, instance });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    const code = error instanceof Error ? error.message : "briefing_link_failed";
    const status = code === "briefing_not_found" || code === "client_not_found" ? 404 : ["project_client_mismatch", "briefing_already_linked"].includes(code) ? 409 : 500;
    console.error("Briefing project link failed", error);
    return Response.json({ ok: false, error: code }, { status });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAlgenriInternalUser(request);
    const { id } = await context.params;
    await unlinkBriefingInstanceFromProject(id);
    return Response.json({ ok: true });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    const code = error instanceof Error ? error.message : "briefing_unlink_failed";
    const status = code === "briefing_not_found" ? 404 : code === "briefing_has_dossier" ? 409 : 500;
    console.error("Briefing project unlink failed", error);
    return Response.json({ ok: false, error: code }, { status });
  }
}
