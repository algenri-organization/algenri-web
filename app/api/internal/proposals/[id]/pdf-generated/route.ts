import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { recordProposalPdfGeneration } from "@/lib/proposals/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { id } = await context.params;
    const pdfMetadata = await recordProposalPdfGeneration(id, user.email ?? user.uid);
    if (!pdfMetadata) return Response.json({ ok: false, error: "proposal_not_found" }, { status: 404 });
    return Response.json({ ok: true, pdfMetadata });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    console.error("Proposal PDF generation record failed", error);
    return Response.json({ ok: false, error: "pdf_record_failed" }, { status: 500 });
  }
}
