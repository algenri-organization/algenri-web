import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { createBriefingInstance } from "@/lib/briefing/instance-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const body = await request.json();
    const templateId = String(body.templateId ?? "");
    const clientName = String(body.clientName ?? "").trim();
    const projectName = String(body.projectName ?? "").trim();
    const slug = String(body.slug ?? "").trim();

    if (!templateId || !clientName || !projectName || !slug) {
      return Response.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    const { record, token } = await createBriefingInstance({
      templateId,
      clientName,
      projectName,
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
      },
      accessUrl: `${origin}/briefing/${record.slug}?token=${encodeURIComponent(token)}`,
    }, { status: 201 });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;

    const code = error instanceof Error ? error.message : "briefing_instance_create_failed";
    const status = code === "template_not_found" ? 404 : code === "template_not_published" || code === "slug_in_use" || code === "invalid_slug" ? 409 : 500;
    console.error("Briefing instance creation failed", error);
    return Response.json({ ok: false, error: code }, { status });
  }
}
