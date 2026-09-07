import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { updateCharge } from "@/lib/finance/store";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAlgenriInternalUser(request);
    const { id } = await params;
    const charge = await updateCharge(id, await request.json());
    if (!charge) return Response.json({ ok: false, error: "charge_not_found" }, { status: 404 });
    return Response.json({ ok: true, charge });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    console.error("Finance charge update failed", error);
    return Response.json({ ok: false, error: "finance_charge_update_failed" }, { status: 500 });
  }
}
