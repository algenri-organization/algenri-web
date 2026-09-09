import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { listPublishedProposalModels } from "@/lib/proposals/model-application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAlgenriInternalUser(request);
    return Response.json({ ok: true, models: await listPublishedProposalModels() });
  } catch (error) {
    const auth = internalAuthResponse(error);
    if (auth) return auth;
    console.error("Published proposal model list failed", error);
    return Response.json({ ok: false, error: "proposal_model_list_failed" }, { status: 500 });
  }
}
