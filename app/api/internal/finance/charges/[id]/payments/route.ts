import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { recordChargePayment } from "@/lib/finance/store";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const { id } = await params;
    const charge = await recordChargePayment(id, await request.json(), user.email ?? user.uid);
    if (!charge) return Response.json({ ok: false, error: "charge_not_found" }, { status: 404 });
    return Response.json({ ok: true, charge }, { status: 201 });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    const code = error instanceof Error ? error.message : "finance_payment_create_failed";
    const status = ["payment_amount_required", "payment_exceeds_balance", "charge_cancelled", "charge_already_paid"].includes(code) ? 400 : 500;
    return Response.json({ ok: false, error: code }, { status });
  }
}
