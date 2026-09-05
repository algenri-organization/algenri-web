import { z } from "zod";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { templateSnapshotSchema } from "@/lib/briefing/schema";
import { getBriefingTemplate, updateBriefingTemplate } from "@/lib/briefing/template-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updatePayloadSchema = z.object({
  template: templateSnapshotSchema,
  status: z.enum(["draft", "review", "published", "archived"]),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireAlgenriInternalUser(request);
    const { id } = await context.params;
    const template = await getBriefingTemplate(id);

    if (!template) {
      return Response.json({ ok: false, error: "template_not_found" }, { status: 404 });
    }

    return Response.json({ ok: true, template });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;

    console.error("Briefing template read failed", error);
    return Response.json({ ok: false, error: "briefing_template_read_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { id } = await context.params;
    const parsed = updatePayloadSchema.safeParse(await request.json());

    if (!parsed.success) {
      return Response.json({
        ok: false,
        error: "invalid_template_payload",
        issues: parsed.error.issues,
      }, { status: 400 });
    }

    const updated = await updateBriefingTemplate({
      id,
      snapshot: parsed.data.template,
      status: parsed.data.status,
      updatedBy: user.email,
    });

    if (!updated) {
      return Response.json({ ok: false, error: "template_not_found" }, { status: 404 });
    }

    return Response.json({ ok: true, template: updated });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;

    console.error("Briefing template update failed", error);
    return Response.json({ ok: false, error: "briefing_template_update_failed" }, { status: 500 });
  }
}
