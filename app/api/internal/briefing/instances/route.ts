import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { createBriefingInstance, listBriefingInstances } from "@/lib/briefing/instance-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAlgenriInternalUser(request);
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId") || undefined;
    const unlinked = url.searchParams.get("unlinked") === "true";
    const instances = await listBriefingInstances({ projectId, unlinked });
    return Response.json({
      ok: true,
      instances: instances.map((instance) => ({
        id: instance.id,
        clientId: instance.clientId,
        projectId: instance.projectId,
        linkedAt: instance.linkedAt ?? null,
        clientName: instance.clientName,
        projectName: instance.projectName,
        slug: instance.slug,
        status: instance.status,
        progress: instance.progress,
        createdAt: instance.createdAt,
        startedAt: instance.startedAt,
        lastSavedAt: instance.lastSavedAt,
        completedAt: instance.completedAt,
        templateName: instance.templateSnapshot.name,
        templateVersion: instance.templateVersion,
      })),
    });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    console.error("Briefing instance list failed", error);
    return Response.json({ ok: false, error: "briefing_instance_list_failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const body = await request.json();
    const templateId = String(body.templateId ?? "");
    const clientName = String(body.clientName ?? "").trim();
    const projectName = String(body.projectName ?? "").trim();
    const clientId = String(body.clientId ?? "").trim() || undefined;
    const projectId = String(body.projectId ?? "").trim() || undefined;
    const slug = String(body.slug ?? "").trim();

    if (!templateId || !slug || ((!clientId || !projectId) && (!clientName || !projectName))) {
      return Response.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    const { record, token } = await createBriefingInstance({
      templateId,
      clientName,
      projectName,
      clientId,
      projectId,
      slug,
      createdBy: user.email ?? user.uid,
    });

    const origin = new URL(request.url).origin;
    return Response.json({
      ok: true,
      instance: {
        id: record.id,
        slug: record.slug,
        clientName: record.clientName,
        projectName: record.projectName,
        status: record.status,
        linkedAt: record.linkedAt ?? null,
      },
      accessUrl: `${origin}/briefing/${record.slug}?token=${encodeURIComponent(token)}`,
    }, { status: 201 });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    const code = error instanceof Error ? error.message : "briefing_instance_create_failed";
    const status = code === "template_not_found" || code === "client_not_found" ? 404 : ["template_not_published","slug_in_use","invalid_slug","project_client_mismatch"].includes(code) ? 409 : 500;
    console.error("Briefing instance creation failed", error);
    return Response.json({ ok: false, error: code }, { status });
  }
}
