import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { listCommercialLeads } from "@/lib/leads/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
