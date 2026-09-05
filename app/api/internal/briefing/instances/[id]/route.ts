import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getInternalBriefingInstance, resetBriefingInstance } from "@/lib/briefing/instance-store";
import { refreshBriefingInstanceTemplate } from "@/lib/briefing/instance-refresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAlgenriInternalUser(request);
    const { id } = await context.params;
    const result = await getInternalBriefingInstance(id);
    if (!result) return Response.json({ ok: false, error: "briefing_not_found" }, { status: 404 });

    const { instance, answers } = result;
    return Response.json({
      ok: true,
      briefing: {
        id: instance.id,
        templateId: instance.templateId,
        clientName: instance.clientName,
        projectName: instance.projectName,
        slug: instance.slug,
        status: instance.status,
        progress: instance.progress,
        createdAt: instance.createdAt,
        startedAt: instance.startedAt,
        lastSavedAt: instance.lastSavedAt,
        completedAt: instance.completedAt,
        template: instance.templateSnapshot,
        answers,
      },
    });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    console.error("Briefing instance detail failed", error);
    return Response.json({ ok: false, error: "briefing_instance_detail_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAlgenriInternalUser(request);
    const { id } = await context.params;
    const body = await request.json();
    const templateId = typeof body.templateId === "string" ? body.templateId.trim() : "";
    if (!templateId) return Response.json({ ok: false, error: "template_required" }, { status: 400 });

    const result = await refreshBriefingInstanceTemplate(id, templateId);
    if (!result) return Response.json({ ok: false, error: "briefing_not_found" }, { status: 404 });
    return Response.json(result);
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    const code = error instanceof Error ? error.message : "";
    if (code === "template_not_found") return Response.json({ ok: false, error: code }, { status: 404 });
    if (code === "template_not_published") return Response.json({ ok: false, error: code }, { status: 409 });
    console.error("Briefing template refresh failed", error);
    return Response.json({ ok: false, error: "briefing_template_refresh_failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAlgenriInternalUser(request);
    const { id } = await context.params;
    const result = await resetBriefingInstance(id);
    if (!result) return Response.json({ ok: false, error: "briefing_not_found" }, { status: 404 });
    return Response.json(result);
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    console.error("Briefing reset failed", error);
    return Response.json({ ok: false, error: "briefing_reset_failed" }, { status: 500 });
  }
}
