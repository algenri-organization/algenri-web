import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { listBriefingTemplates } from "@/lib/briefing/template-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAlgenriInternalUser(request);
    const templates = await listBriefingTemplates();

    return Response.json({
      ok: true,
      templates: templates.map((template) => ({
        id: template.id,
        name: template.name,
        projectType: template.projectType,
        version: template.version,
        status: template.status,
        sectionCount: template.sections.length,
        questionCount: template.sections.reduce((sum, section) => sum + section.questions.length, 0),
        updatedAt: template.updatedAt,
        createdBy: template.createdBy,
      })),
    });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;

    console.error("Briefing template list failed", error);
    return Response.json({ ok: false, error: "briefing_template_list_failed" }, { status: 500 });
  }
}
