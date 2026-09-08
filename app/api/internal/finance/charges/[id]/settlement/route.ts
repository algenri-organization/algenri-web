import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { reconcileCharge } from "@/lib/finance/store";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAlgenriInternalUser(request);
    const { id } = await params;
    const charge = await reconcileCharge(id, await request.json());
    if (!charge) return Response.json({ ok: false, error: "charge_not_found" }, { status: 404 });
    return Response.json({ ok: true, charge });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    const code = error instanceof Error ? error.message : "finance_settlement_failed";
    if (code === "charge_not_paid" || code === "provider_fee_invalid") return Response.json({ ok: false, error: code }, { status: 400 });
    console.error("Finance settlement failed", error);
    return Response.json({ ok: false, error: "finance_settlement_failed" }, { status: 500 });
  }
}
