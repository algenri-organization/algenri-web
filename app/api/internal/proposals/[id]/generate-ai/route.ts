import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { generateProposalWithAi } from "@/lib/proposals/ai-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statusByCode: Record<string, number> = {
  proposal_not_found: 404,
  proposal_locked: 409,
  dossier_not_available: 409,
  briefing_not_available: 409,
  ai_not_configured: 503,
  ai_invalid_credentials: 503,
  ai_insufficient_quota: 402,
  ai_rate_limited: 429,
  ai_model_unavailable: 503,
  ai_provider_unavailable: 503,
  ai_provider_unreachable: 503,
  ai_schema_rejected: 502,
  ai_empty_response: 502,
  ai_invalid_response: 502,
  ai_generation_failed: 502,
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const source = ["auto", "dossier", "briefing", "project"].includes(String(body.source)) ? body.source : "auto";
    const result = await generateProposalWithAi({
      proposalId: id,
      source,
      instructions: String(body.instructions ?? ""),
      updatedBy: user.email ?? user.uid,
    });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    const code = error instanceof Error ? error.message : "ai_generation_failed";
    const status = statusByCode[code] ?? 500;
    console.error("Proposal AI generation failed", { code, status });
    return Response.json({ ok: false, error: code }, { status });
  }
}
