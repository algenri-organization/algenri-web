import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getBankingStatus } from "@/lib/finance/banking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAlgenriInternalUser(request);
    return Response.json({ ok: true, providers: getBankingStatus() });
  } catch (error) {
    const authResponse = internalAuthResponse(error); if (authResponse) return authResponse;
    console.error("Banking status failed", error);
    return Response.json({ ok: false, error: "banking_status_failed" }, { status: 500 });
  }
}
