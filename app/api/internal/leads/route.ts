import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { deleteAllCommercialLeads, listCommercialLeads } from "@/lib/leads/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function canClearTestLeads(email: string) {
  const configured = process.env.ALGENRI_INTERNAL_ALLOWED_EMAILS ?? "michel@algenri.com.br";
  const allowed = new Set(configured.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
  return allowed.has(email.toLowerCase());
}

export async function GET(request: Request) {
  try {
    await requireAlgenriInternalUser(request);
    const leads = await listCommercialLeads();
    return Response.json({ ok: true, leads });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    console.error("Commercial leads load failed", error);
    return Response.json({ ok: false, error: "lead_list_failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    if (!canClearTestLeads(user.email)) {
      return Response.json({ ok: false, error: "lead_clear_not_allowed" }, { status: 403 });
    }
    if (request.headers.get("x-algenri-confirm") !== "DELETE_ALL_TEST_LEADS") {
      return Response.json({ ok: false, error: "confirmation_required" }, { status: 400 });
    }

    const deleted = await deleteAllCommercialLeads();
    return Response.json({ ok: true, deleted });
  } catch (error) {
    const authResponse = internalAuthResponse(error);
    if (authResponse) return authResponse;
    console.error("Commercial leads clear failed", error);
    return Response.json({ ok: false, error: "lead_clear_failed" }, { status: 500 });
  }
}
