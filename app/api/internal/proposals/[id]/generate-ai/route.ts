import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { generateProposalWithAi } from "@/lib/proposals/ai-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const status = code === "proposal_not_found" ? 404 : code === "proposal_locked" || code === "dossier_not_available" || code === "briefing_not_available" ? 409 : code === "ai_not_configured" ? 503 : 500;
    console.error("Proposal AI generation failed", error);
    return Response.json({ ok: false, error: code }, { status });
  }
}
