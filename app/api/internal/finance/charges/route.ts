import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { createCharge, listCharges } from "@/lib/finance/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAlgenriInternalUser(request);
    return Response.json({ ok: true, charges: await listCharges() });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    console.error("Finance charge list failed", error);
    return Response.json({ ok: false, error: "finance_charge_list_failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAlgenriInternalUser(request);
    const charge = await createCharge(await request.json(), user.email ?? user.uid);
    return Response.json({ ok: true, charge }, { status: 201 });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    const code = error instanceof Error ? error.message : "finance_charge_create_failed";
    const status = ["description_required","amount_required","due_date_required"].includes(code) ? 400 : ["client_not_found","project_not_found"].includes(code) ? 404 : 500;
    return Response.json({ ok: false, error: code }, { status });
  }
}
