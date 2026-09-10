import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getKieCreditBalance, getKieIntegrationStatus } from "@/lib/studio/kie";

export async function GET(request: Request) {
  try {
    await requireAlgenriInternalUser(request);
    const status = getKieIntegrationStatus();
    let credits: number | null = null;
    let creditError: string | null = null;

    if (status.configured) {
      try {
        credits = await getKieCreditBalance();
      } catch (error) {
        creditError = error instanceof Error ? error.message : "kie_credit_check_failed";
      }
    }

    return Response.json({ ok: true, provider: "kie-ai", ...status, credits, creditError });
  } catch (error) {
    return internalAuthResponse(error) ?? Response.json({ ok: false, error: "kie_status_failed" }, { status: 500 });
  }
}
